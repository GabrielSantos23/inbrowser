const pdf = await import("pdf-parse");
console.log("Keys:", Object.keys(pdf));
console.log("Type:", typeof pdf);
console.log("Default type:", typeof (pdf as any).default);
