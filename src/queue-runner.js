setInterval(async () => {
  try {
    // const resp = await fetch("http://localhost:3000/api/queue/worker");
    const resp = await fetch("http://172.16.0.155:80/api/queue/worker");
    const json = await resp.json();
    console.log("[worker]", json);
  } catch (e) {
    console.error("Worker error:", e);
  }
}, 5000); // executa a cada 5 segundos

console.log("Queue worker iniciado...");
