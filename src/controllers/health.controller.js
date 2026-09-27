export const healthCheck = (req, res) => {
  res.json({ success: true, message: "OK", uptime: process.uptime() });
};
