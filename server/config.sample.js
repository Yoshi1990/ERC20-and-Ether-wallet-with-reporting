module.exports = {
    title: 'make it wei(n)',
    private_policy_url: '',
    description: '',
    google_analytics: 'todo',
    erc20: {
        contract: '',
        decimals: 6,
        name: 'Tronix',
        symbol: 'TRX',
        // Find it on https://api.coinmarketcap.com/v2/listings/
        coinmarketcap_id: 1958,
    },
    infura_apikey: '',
    etherscan_apikey: '',
    auth: {
        name: 'test',
        pass: 'test',
    },
    network: 'homestead', // prod: homestead
    email: {
        transport: {
            host: 'smtp-relay.sendinblue.com',
            port: 587,
            secure: false,
            auth: {
                user: '',
                pass: ''
            },
            logger: true,
        },
        sender_email: '',
        sender_name: '',
        signature: 'The XXX Team',
        signup_message: 'Please confirm your account to access your personal interface.',
    },
}
