declare module 'node-7z' {
  interface SevenOptions {
    password?: string;
    $progress?: boolean;
  }

  interface Seven {
    extractFull: (
      archivePath: string,
      destPath: string,
      options: SevenOptions
    ) => {
      on: (event: 'end' | 'error', callback: (err?: Error) => void) => void;
    };
  }

  const Seven: Seven;
  export default Seven;
}
