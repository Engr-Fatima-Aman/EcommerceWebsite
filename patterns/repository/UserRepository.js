const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    findByEmail(email) {
        return this.db
            .prepare('SELECT * FROM users WHERE email = ?')
            .get(email);
    }

    findAllCustomers() {
        return this.db
            .prepare("SELECT * FROM users WHERE role = 'customer' ORDER BY id DESC")
            .all();
    }

    countCustomers() {
        return this.db
            .prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'")
            .get().c;
    }
}

module.exports = UserRepository;
