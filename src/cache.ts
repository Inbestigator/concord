import {
  APIChannel,
  APIGuild,
  APIGuildMember,
  APIRole,
  APIUser,
} from "discord-api-types/v10";
import {
  getChannel as getChannelDressed,
  getGuild as getGuildDressed,
  getMember as getMemberDressed,
  getRole as getRoleDressed,
  getUser as getUserDressed,
} from "@dressed/dressed";

export const guildCache = new Map<string, APIGuild>();
export const userCache = new Map<string, APIUser>();
export const memberCache = new Map<string, APIGuildMember>();
export const channelCache = new Map<string, APIChannel>();
export const roleCache = new Map<string, APIRole>();
export const colourCache = new Map<
  string,
  { r: number; g: number; b: number }
>();

export async function getUser(id: string) {
  if (userCache.has(id)) return userCache.get(id);
  const user = await getUserDressed(id);
  userCache.set(id, user);
  return user;
}

export async function getGuild(id: string) {
  if (guildCache.has(id)) return guildCache.get(id);
  const guild = await getGuildDressed(id);
  guildCache.set(id, guild);
  return guild;
}

export async function getMember(guildId: string, id: string) {
  if (memberCache.has(`${guildId}-${id}`)) {
    return memberCache.get(`${guildId}-${id}`);
  }
  const member = await getMemberDressed(guildId, id);
  memberCache.set(`${guildId}-${id}`, member);
  return member;
}

export async function getChannel(id: string) {
  if (channelCache.has(id)) return channelCache.get(id);
  const channel = await getChannelDressed(id);
  channelCache.set(id, channel);
  return channel;
}

export async function getRole(guildId: string, id: string) {
  if (roleCache.has(`${guildId}-${id}`)) {
    return roleCache.get(`${guildId}-${id}`);
  }
  const role = await getRoleDressed(guildId, id);
  roleCache.set(`${guildId}-${id}`, role);
  return role;
}

export function getColour(id: string) {
  if (colourCache.has(id)) return colourCache.get(id)!;
  const r = Math.floor(Math.random() * 128 + 128);
  const g = Math.floor(Math.random() * 128 + 128);
  const b = Math.floor(Math.random() * 128 + 128);
  colourCache.set(id, { r, g, b });
  return { r, g, b };
}
