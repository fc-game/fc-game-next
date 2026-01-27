/**
 * 文件读取
 * @param {*} file
 * @returns
 */
const pFileReader = (file: File) => {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = resolve;
    reader.readAsBinaryString(file);
  });
};

/**
 * 是否有文件
 * @param {*} byteString
 * @returns
 */
const hashFile = function (byteString: string) {
  const asHex = (buffer: ArrayBuffer) => {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };
  const ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return crypto.subtle.digest("SHA-1", ab).then(asHex);
};

/**
 * ROM相关方法
 */
const RomLibrary = {
  getRomInfoByHash: function (hash: string) {
    return this.load().find((rom: any) => rom.hash === hash);
  },
  //保存
  save: function (file: File) {
    return pFileReader(file)
      .then((readFile: any) => {
        const byteString = readFile.target.result;
        return hashFile(byteString).then((hash) => {
          return { hash, byteString };
        });
      })
      .then(({ hash, byteString }) => {
        const savedRomInfo = localStorage.getItem("savedRomInfo");
        const existingLibrary = savedRomInfo ? JSON.parse(savedRomInfo) : [];

        const rom = {
          name: file.name,
          hash: hash,
          added: Date.now(),
        };

        const newRomInfo = JSON.stringify(existingLibrary.concat([rom]));

        localStorage.setItem("savedRomInfo", newRomInfo);
        localStorage.setItem("blob-" + hash, byteString);

        return rom;
      });
  },
  //加载
  load: function () {
    const localData = localStorage.getItem("savedRomInfo");
    if (!localData) return [];
    const savedRomInfo = localStorage.getItem("savedRomInfo");
    return savedRomInfo ? JSON.parse(savedRomInfo) : [];
  },
  //删除
  delete: function (hash: string) {
    const existingLibrary = this.load();
    localStorage.removeItem("blob-" + hash);
    localStorage.setItem(
      "savedRomInfo",
      JSON.stringify(existingLibrary.filter((rom: any) => rom.hash !== hash)),
    );
  },
};

export default RomLibrary;
