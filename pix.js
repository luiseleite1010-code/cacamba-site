const SK = process.env.MEDUSAPAY_SK;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ sucesso: false, erro: 'Método não permitido' });

  const { valor, email, nome, cpf } = req.body;

  if (!nome || !email || !cpf) {
    return res.status(400).json({ sucesso: false, erro: 'Dados incompletos (nome, email, cpf obrigatórios)' });
  }

  const valorCentavos = Math.round((parseFloat(valor) || 49.99) * 100);
  const cpfLimpo = cpf.replace(/[^0-9]/g, '');

  const payload = {
    amount: valorCentavos,
    paymentMethod: 'pix',
    customer: {
      name: String(nome),
      email: String(email),
      document: {
        number: cpfLimpo,
        type: 'cpf'
      }
    },
    items: [
      {
        title: 'Taxa de Entrega - CaçambaFácil',
        unitPrice: valorCentavos,
        quantity: 1,
        tangible: false
      }
    ],
    pix: {
      expiresInDays: 1
    }
  };

  try {
    const auth = Buffer.from(SK.trim() + ':x').toString('base64');

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

    if (response.ok) {
      const pixData = resultado?.data?.pix ?? resultado?.pix ?? {};

      return res.status(200).json({
        sucesso: true,
        qr_code:    pixData.qrcode        ?? pixData.qrCode        ?? null,
        copia_cola: pixData.qrcode_base64 ?? pixData.qrCodeBase64  ?? pixData.payload ?? null,
      });
    } else {
      const msg = resultado?.message ?? resultado?.error ?? 'Erro desconhecido';
      return res.status(200).json({
        sucesso: false,
        erro: `MedusaPay: ${msg} (HTTP ${response.status})`
      });
    }

  } catch (err) {
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro de conexão com a MedusaPay: ' + err.message
    });
  }
}
