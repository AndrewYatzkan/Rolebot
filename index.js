const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs-extra');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter token: ', (answer) => {

  if (!answer) {
  	console.log('You did not enter a token');
  	return;
  }
  console.log(`Attempting to log in...`);
  login(answer);

  rl.close();
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
 
client.on('message', async msg => {
	var code;
	if (code = msg.content.match(/^!activate ([^\s]+)$/)) {
		code = code[1];

		var roleName;
		if (roleName = await db.getRole(code)) {
		    var userID = msg.author.id;
		    var member = msg.guild.members.get(userID);
		    var username = member.user.username;
		    var discriminator = member.user.discriminator;
		    console.log(`${username}#${discriminator}`);
		    var role = msg.guild.roles.find(r => r.name === roleName);
		    if (typeof roleName === "boolean") {
		    	msg.reply(`It appears that the code you supplied has already been redeemed.`);
		    } else if (await db.expired(code)) {
		    	msg.reply(`This code is expired.`);
		    } else if (!role) {
		    	msg.reply(`I would love to give you the ${roleName} role, but alas I am unable to, as it does not exist.`)
		    } else {
		    	if (await db.used(code)) {
		    		try {
		    			member.addRole(role);
		    		} catch (e) {
		    			msg.reply(`I am unable to assign you to this role. (It is a higher role than I have)`);
		    			return;
		    		}
		    		console.log(`${username}#${discriminator} was given the role: ${roleName}`);
		    		msg.reply(`Activation successful :smiley:`);
		    	} else {
		    		msg.reply(`Error: There was a problem updating the database.`);
		    	}
		    }
	} else {
		msg.reply("It appears that the code you supplied is invalid.");
	}
  }
});

function login(token) {
	client.login(token).catch(err => {
		console.log('Could not login. Incorrect token?');
		process.exit(1);
	});
}

function database() {
	if (!fs.existsSync(path)) fs.writeFile(path, 'code,role,used,expiration\n', 'utf8', ()=>{});
	return {
		getRole: async code => {
			var data = await fs.readFile(path);
			var array = data.toString().trim().split('\n');
			for (var i = 1; i < array.length; i++) {
				array[i] = array[i].split(',');
				if (array[i][0] === code) {
					if (array[i][2] === "yes")
						return true;
					else
						return array[i][1];
				}
			}
			return false;
		},
		used: async code => {
			var data = await fs.readFile(path);
			var array = data.toString().trim().split('\n');
			for (var i = 1; i < array.length; i++) {
				array[i] = array[i].split(',');
				if (array[i][0] === code) {
					array[i][2] = "yes";
					await fs.writeFile(path, array.join('\n'), 'utf8');
					return true;
				}
			}
			return false;
		},
		expired: async code => {
			var data = await fs.readFile(path);
			var array = data.toString().trim().split('\n');
			for (var i = 1; i < array.length; i++) {
				array[i] = array[i].split(',');
				if (array[i][0] === code) return array[i][3] === "never" ? false : parseInt(array[i][3]) < new Date().getTime();
			}
		}
	}
}

const path = `${__dirname}/data.csv`;
const db = database();
const app = require('express')();
const port = 2000;

app.get("/", async (req, res) => {
	if (!!req.query.code) {
		res.send('');
		return;
	} else if (!!req.query.content) {
		await fs.writeFile(path, decodeURI(req.query.content), 'utf8');
		res.send('');
		return;
	} else if (!!req.query.get) {
		res.send(await fs.readFile(path));
		return;
	}
	res.sendFile(`${__dirname}/index.html`);
});

app.listen(port, () => {});