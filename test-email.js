const identifier = "70 00 00 00";
const trimmedId = identifier.trim();
const isPhone = /^\+?[0-9\s]+$/.test(trimmedId);
const authEmail = isPhone ? `${trimmedId.replace(/\s+/g, '')}@zaka.bf` : trimmedId;
console.log(authEmail);
