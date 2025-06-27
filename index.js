import "dotenv/config";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import express from "express";

const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(3000, () => console.log("✅ Web server running"));

const TOKEN = process.env.DISCORD_TOKEN;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.GuildMember],
});

const inviteCache = new Map();

// 招待コードとロールIDの対応をここに記述
const inviteRoleMap = {
  vxgsebJYTb: "1385261442206531618",
  "5SMHuury6m": "138526236885177699",
  vxgesBjYTb: "1385261442206531618", // 👈 これを必ず追加！
};

client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  for (const [id, guild] of client.guilds.cache) {
    const invites = await guild.invites.fetch();
    inviteCache.set(guild.id, invites);
  }
});

client.on("inviteCreate", async (invite) => {
  const invites = await invite.guild.invites.fetch();
  inviteCache.set(invite.guild.id, invites);
});

client.on("guildMemberAdd", async (member) => {
  try {
    const cachedInvites = inviteCache.get(member.guild.id);
    const newInvites = await member.guild.invites.fetch();
    inviteCache.set(member.guild.id, newInvites);

    const usedInvite = newInvites.find((inv) => {
      const cached = cachedInvites.get(inv.code);
      return cached && inv.uses > cached.uses;
    });

    if (usedInvite) {
      const roleId = inviteRoleMap[usedInvite.code];
      if (roleId) {
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
          await member.roles.add(role);
          console.log(`✅ ${member.user.tag} に ${role.name} を付与しました`);
        }
      }
    }
  } catch (err) {
    console.error("❌ エラー:", err);
  }
});

client.login(TOKEN);
