export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const dados = req.body || {};
  const acao = req.query.acao || dados.acao || '';

  if (acao !== 'gerar_pix') {
    return res.status(400).json({ sucesso: false, erro: 'Ação inválida' });
  }

  const SK = process.env.MEDUSAPAY_SK;
  if (!SK) return res.status(500).json({ sucesso: false, erro: 'Chave SK não configurada' });

  const valor   = parseFloat(dados.valor) || 49.99;
  const email   = String(dados.email || '');
  const nome    = String(dados.nome  || '');
  const cpf     = String(dados.cpf   || '').replace(/[^0-9]/g, '');

  const payload = {
    amount: Math.floor(valor * 100),
    paymentMethod: 'pix',
    customer: {
      name: nome,
      email: email,
      document: { number: cpf, type: 'cpf' }
    },
    items: [{
      title: 'Taxa de Entrega - CacambaFacil',
      unitPrice: Math.floor(valor * 100),
      quantity: 1,
      tangible: false
    }],
    pix: { expiresInDays: 1 }
  };

  const auth = Buffer.from(SK.trim() + ':x').toString('base64');

  try {
    const response = await fetch('https://api.v2.medusapay.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + auth
      },
      body: JSON.stringify(payload)
    });

    const resultado = await response.json();

    if (response.status >= 200 && response.status < 300) {
      // Busca o pixData em todos os lugares possíveis
      const pixData = resultado?.data?.pix
                   ?? resultado?.pix
                   ?? resultado?.data
                   ?? {};

      // QR Code: pode vir como base64 puro, URL ou data URI
      const qrRaw = pixData.qrcode
                 ?? pixData.qrCode
                 ?? pixData.qr_code
                 ?? pixData.base64
                 ?? pixData.image
                 ?? null;

      // Copia e cola: o payload de texto do pix
      const copiaCola = pixData.payload
                     ?? pixData.qrcode_text
                     ?? pixData.emv
                     ?? pixData.brcode
                     ?? pixData.copy_paste
                     ?? pixData.qrcode_base64
                     ?? pixData.qrCodeBase64
                     ?? null;

      // Formata o QR como data URI se necessário
      let qrFinal = null;
      if (qrRaw) {
        if (qrRaw.startsWith('data:') || qrRaw.startsWith('http')) {
          qrFinal = qrRaw;
        } else {
          qrFinal = 'data:image/png;base64,' + qrRaw;
        }
      }

      return res.status(200).json({
        sucesso: true,
        qr_code: qrFinal,
        copia_cola: copiaCola,
        _debug: resultado  // mostra retorno completo para diagnóstico
      });

    } else {
      const msg = resultado?.message ?? resultado?.error ?? 'Erro desconhecido';
      return res.status(200).json({
        sucesso: false,
        erro: 'MedusaPay: ' + msg + ' (HTTP ' + response.status + ')'
      });
    }

  } catch (err) {
    return res.status(500).json({ sucesso: false, erro: 'Erro de conexão: ' + err.message });
  }
}
