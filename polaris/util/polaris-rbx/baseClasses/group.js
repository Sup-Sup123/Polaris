const request = require('request-promise');
class Group {
	constructor (groupId) {
		this.id = groupId;
		this.users = new Map();
	}
	clearCache () {
		// Clear rank cache
		this.users.clear();
	}


    
	async getRank (userIdOrUserClass) {
		if (!userIdOrUserClass) return;
		const id = typeof userIdOrUserClass === 'number' || typeof userIdOrUserClass === 'string' ? userIdOrUserClass : userIdOrUserClass.id;
		if (this.users.get(id)) {
			// Possible cache hit
			if (this.users.get(id).rank !== undefined) return this.users.get(id).rank;
		}
		const options = {
			method: 'GET',
			uri: `https://api.roblox.com/users/${id}/groups`,
		};
		try {
			let res = await request(options);
			res = JSON.parse(res);
			const groupObject = res.filter((group) => this.id === group.Id)[0] || {};
			let rank = groupObject.Rank ? groupObject.Rank : 0;

			if (this.users.get(id)) {
				const cache = this.users.get(id);
				cache.rank = rank;
				this.users.set(id, cache);
			} else {
				this.users.set(id, {rank: rank});
			}
			return rank;
		} catch (error) {
			if (error.statusCode === 404 ||error.statusCode === 400) return {error: {status: 404, message: 'User or group not found'}};
			if (error.statusCode === 503) return {error: {status: 503, message: 'Service Unavailible - Roblox is down.'}};
			throw new Error(error);
		}
	}
	async getRole (userIdOrUserClass) {
		if (!userIdOrUserClass) return;
		const id = typeof userIdOrUserClass === 'number' || typeof userIdOrUserClass === 'string' ? userIdOrUserClass : userIdOrUserClass.id;
		const cache = this.users.get(id);
		if (cache) {
			// Possible cache hit
			const role = this.users.get(id).role;
			if (role) return role;
		}
		const options = {
			method: 'GET',
			uri: `https://api.roblox.com/users/${id}/groups`,
		};

		try {
			let res = await request(options);
			res = JSON.parse(res);
			const groupObject = res.filter((group) => this.id === group.Id)[0] || {};
			const role = groupObject.Role ? groupObject.Role : "Guest";


			if (this.users.get(id)) {
				this.users.get(id).role = role;
			} else {
				this.users.set(id, {role: role});
			}
			return role;
		} catch (error) {
			if (error.statusCode === 404 || error.statusCode === 400) return {error: {status: 404, message: 'User or group not found'}};
			if (error.statusCode === 503) return {error: {status: 503, message: 'Service Unavailable - Roblox is down.'}};
			throw new Error(error);
		}
	}
	async updateInfo () {
		try {
			let res = await request(`https://api.roblox.com/groups/${this.id}`);
			res = JSON.parse(res);
			this.name = res.Name;
			this.roles = res.Roles;
			this.description = res.Description;
			this.owner = res.Owner;
			this.emblemUrl = res.EmblemUrl;

		} catch (error) {
			if (error.statusCode === 404) return {error: {status: 404, message: 'Group not found'}};
			if (error.statusCode === 503) return {error: {status: 503, message: 'Group info not available'}};
			// Not 404
			throw new Error(error);
		}
	}
	async getRoles () {
		if (this.roles) return this.roles;

		const res = await this.updateInfo();
		if (res.error) return res;
		return this.Roles;
	}
}

module.exports = Group;
