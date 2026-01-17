export function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error("Invalid expiresIn format");
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    default:
      throw new Error("Invalid time unit");
  }
}

export function getExpirationDate(expiresIn: string): Date {
  const seconds = parseExpiresIn(expiresIn);
  return new Date(Date.now() + seconds * 1000);
}
