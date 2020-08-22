// Includes
const { prefix, token, mongodb } = require('./.config.json');
const Discord = require('discord.js');
const bot = new Discord.Client();
const mongoose = require('mongoose');
// Connect to database
mongoose.connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log('database connection successful');
});


// Startup
bot.once('ready', () => {
	console.log('Started up successfully');
	bot.user.setActivity('Use t.help for info');

});

const UsersSchema = new mongoose.Schema({
	name: String,
	link: String,
});

const UsersDB = mongoose.model('User', UsersSchema);

// Commands
bot.on('message', async message => {
	if(message.author.bot) return;
	if (message.content.startsWith(prefix)) {
		const input = message.content.slice(prefix.length).trim().split(' ');
		const command = input.shift();
		try {
			// Help Command here
			if (command === 'help') {
				const helpEmbed = new Discord.MessageEmbed()
					.setTitle('Command List')
					.addField('t.register:', 'to set up your account use `t.register <https://t.me/(username)>`')
					.addField('t.profile:', 'to call your profile link use `t.profile`, use `t.profile @JohnDoe#0000` to see if another user has a telegram account linked with the bot')
					.addField('t.edit', 'to edit the telegram link associated with your account type `t.edit <https://t.me/(username)>`')
					.addField('t.delete', 'to deregister your account from the database use `t.deregister`')
					.addField('Note:', 'This Bot is still in development and may have issues')
					.setFooter('Bot made by GlenMerlin');
				message.channel.send(helpEmbed);
			}

			// Register Command Here
			if (command === 'register') {
				UsersDB.findOne({ name: message.author.id }, function(err, users) {
					if (err) return;
					if (users != null) {
						return message.channel.send("You are already registered in my database,\nif you wish to edit or remove yourself from the database please use the appropate commands (see **t.help** for more info)");
					}
					if (message.content.slice(11).match(/(https:\/\/(?:t|telegram)\.me)/gi)){
						const addUserDB = new UsersDB ({ name: message.author.id, link: message.content.slice(11).trim() });
						addUserDB.save(function(err, addUserDB){
							if (err) return console.error(err);
							message.channel.send('Congrats you registered successfully');
						});
					} 
					else {
						return message.channel.send("hmm... that doesn't seem to be a valid telegram link\nmake sure you formatted the command properly (check t.help to see proper formatting)");
					}	 
				});
			
			}
			// Profile Command Here
			if (command === 'profile') {
				let getTheID = message.author.id;
				if (message.mentions.users.first()) {
					getTheID = message.mentions.users.first();
					getTheID = getTheID.id;
				}
				else if(message.content.length > 10){
					getTheID = message.content.slice(10).trim();
				}

				UsersDB.findOne({ name: getTheID }, function(err, users){
					if (err) return message.channel.send('Sorry Something went wrong, if this continues happening try registering again'), console.error(err);
					if (users === null) {
						return message.channel.send("Sorry I couldn't find anything in the database");
					}
					message.channel.send(`Hi there ${message.author} I found ${users.link} in the database!`);
					
				});
			}
			// Edit Command here
			if (command === 'edit') {
				UsersDB.findOne({ name: message.author.id }, function(err, users){
					if (err) return;
					if (users != null) {
						try {
							if (message.content.slice(7).match(/(https:\/\/(?:t|telegram)\.me)/gi)) {
								UsersDB.updateOne(
									{ name: message.author.id },
									{ $set: { link: message.content.slice(7).trim() } },
								);
								message.channel.send('Successfully updated your account');
							}
							else {
								message.channel.send(`hmm... that doesn't seem to be a valid telegram link (check **t.help** for more information)`);
							}
						} 
						catch (e) {
							console.log(e);
						}
					}
					else {
						message.channel.send("hmm you don't seem to have an account... lets fix that, run `t.register [telegram account link]` ");
					}
				});
				
			}
			// Delete Command here
			if (command === 'delete') {
				UsersDB.findOne({ name: message.author.id }, function(err, users) {
					if (err) return;
					if (users != null) {
						const filter = response => {
							return message.content;
						};
						try {
							message.channel.send('Just to be clear you are trying to delete your account right now, if you proceed your account will be deleted...\nType **t.confirm** to confirm your decision (if you did this by mistake just wait 30 seconds)').then(() => {
								message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
									.then(collected => {
										UsersDB.collection.deleteOne({ name: message.author.id });
										message.channel.send(`Account deleted successfully, if you change your mind you can always sign up again with **t.register**`);
									})
									.catch(collected => {
										message.channel.send(`Didn't get confirmation within thirty seconds, your account has been perserved.`);
									});
							});
						}
						catch(e) {
							console.log(e);
						}
					}
					else {
						return message.channel.send("You are not registered in the database, if you want to register see **t.help**");
					}
				});
			}
			// Ping Command here
			if (command === 'ping'){
				const m = await message.channel.send("Checking Ping");
				m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(bot.ws.ping)}ms`);
			}
		}
		catch(err) {
			message.channel.send('Oops something went wrong... try again later');
			console.log(err);
		}
		
	}
});
// Bot login
bot.login(token);