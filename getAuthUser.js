import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));

async function run() {
  const email = "urbain.traore@zaka.bf";
  // To get user info, we would need idToken, or admin sdk.
  // Wait, I can't look up a user by email using just the Web API Key without an admin token, 
  // UNLESS I log in as that user, which I don't have the password for.
  // BUT I can sign up with the same email! If it says "email exists", I can't sign in.
}
run();
