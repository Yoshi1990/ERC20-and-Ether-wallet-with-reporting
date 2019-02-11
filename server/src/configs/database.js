module.exports = {
	client: 'mysql',
	connection: {
		host: process.env.DB_HOST || '127.0.0.1',
		port: process.env.DB_PORT || 3306,
		user: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		charset: process.env.DB_CHARSET || 'utf8mb4',
	},
	pool: {
		min: 1,
		max: 10
	},
	migrations: {
		directory: __dirname + '/../models/migrations',
		tableName: '__migrations',
	},
	seeds: {
		directory: __dirname + '/../models/seeds',
	},
}