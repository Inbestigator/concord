import { blue, bold, italic, underline } from "@std/fmt/colors";

export async function callDiscord(
  endpoint: string,
  options: Record<string, unknown>,
) {
  const url = "https://discord.com/api/v10/" + endpoint;
  if (options.body) options.body = JSON.stringify(options.body);
  const res = await fetch(url, {
    headers: {
      Authorization: Deno.env.get("TOKEN") as string,
      "Content-Type": "application/json; charset=UTF-8",
    },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json();
    console.error(`Failed to ${options.method} ${endpoint}\n└ ${data.message}`);
  }
  return res;
}

export function marky(message: string) {
  message = message.replaceAll(/@everyone|@here|<@.+>/g, (match) => {
    return blue(match);
  });

  message = message.replaceAll(
    /\*\*(.+)\*\*|#+\s(.+)/g,
    (_, group1, group2) => {
      if (group2) return bold(group2);
      return bold(group1);
    },
  );

  message = message.replaceAll(/\*(.+)\*/g, (_, group) => {
    return italic(group);
  });

  message = message.replaceAll(
    /https?:\/\/[^\s]+|<#(.+)>/g,
    (match, _group) => {
      return blue(underline(match));
    },
  );

  return message;
}
