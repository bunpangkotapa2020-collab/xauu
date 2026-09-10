try {
  const now = new Date();
  const str = now.toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log("Success:", str);
} catch (e) {
  console.error("Error:", e.message);
}
