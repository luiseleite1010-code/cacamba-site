export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Mesma lógica do PHP: aceita POST body (JSON)
  const dados = req.body || {};
  const acao = req.query.acao || dados.acao || '';

  if (acao !== 'gerar_pix') {
    return res.status(400).json({ sucesso: false, erro: 'Ação inválida' });
  }

  const SK = process.env.MEDUSAPAY_SK;
  if (!SK) {
    return res.status(500).json({ sucesso: false, erro: 'Chave SK não configurada no servidor' });
  }

  const valor = parseFloat(dados.valor) || 49.99;
  const email = String(dados.email || '');
  const nome  = String(dados.nome  || '');
  const cpf   = String(dados.cpf   || '').replace(/[^0-9]/g, '');

  // Mesmo payload do PHP
  const payload = {
    amount: Math.floor(valor * 100),
    paymentMethod: 'pix',
    customer: {
      name: nome,
      email: email,
      document: {
        number: cpf,
        type: 'cpf'
      }
    },
    items: [
      {
        title: 'Taxa de Entrega - CacambaFacil',
        unitPrice: Math.floor(valor * 100),
        quantity: 1,
        tangible: false
      }
    ],
    pix: {
      expiresInDays: 1
    }
  };

  // Mesma autenticação Basic Auth do PHP: base64(SK + ':x')
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
      // Mesma extração do PHP: $resultado['data']['pix'] ?? $resultado['pix'] ?? []
      const pixData = resultado?.data?.pix ?? resultado?.pix ?? {};

      return res.status(200).json({
        sucesso: true,
        qr_code:    pixData.qrcode        ?? pixData.qrCode        ?? null,
        copia_cola: pixData.qrcode_base64 ?? pixData.qrCodeBase64  ?? pixData.payload ?? null,
        _debug: resultado  // igual ao PHP para debug
      });
    } else {
      const msg = resultado?.message ?? resultado?.error ?? 'Erro de Autenticação RL-2';
      return res.status(200).json({
        sucesso: false,
        erro: 'MedusaPay: ' + msg + ' (HTTP ' + response.status + ')'
      });
    }

  } catch (err) {
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro de Conexão: ' + err.message
    });
  }
}
