// Polyfill Blob.stream() for jsdom
if (typeof Blob !== "undefined" && !Blob.prototype.stream) {
  // @ts-ignore
  Blob.prototype.stream = function () {
    // oxlint-disable-next-line typescript/no-this-alias
    const blob = this;
    return new ReadableStream({
      async start(controller) {
        const arrayBuffer = await blob.arrayBuffer();
        controller.enqueue(new Uint8Array(arrayBuffer));
        controller.close();
      },
    });
  };
}
