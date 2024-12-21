import { blue, bold } from "@std/fmt/colors";

export default function select(options: string[], title: string): number {
  const buffer = new ArrayBuffer(1024);
  Deno.stdin.setRaw(true);
  const buf = new Uint8Array(buffer);

  let position = 0;

  while (true) {
    console.clear();
    console.log(bold(title));
    for (let i = 0; i < options.length; i++) {
      if (i === position) {
        console.log(`> ${blue(options[i])}`);
      } else {
        console.log(`  ${options[i]}`);
      }
    }
    const nread = Deno.stdin.readSync(buf);
    const sub = buf.subarray(0, nread!);

    if (sub[0] === 27 && sub[1] === 91 && sub[2] === 66) {
      if (position < options.length - 1) {
        position++;
      } else if (position == options.length - 1) {
        position = 0;
      }
    }

    if (sub[0] === 27 && sub[1] === 91 && sub[2] === 65) {
      if (position > 0) {
        position--;
      } else if (position == 0) {
        position = options.length - 1;
      }
    }
    if (sub[0] === 3) {
      Deno.exit(0);
    }

    if (sub[0] === 13) {
      break;
    }
  }
  console.clear();
  Deno.stdin.setRaw(false);
  return position;
}
