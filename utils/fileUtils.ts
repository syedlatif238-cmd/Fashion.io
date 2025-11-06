
export const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [mimePart, dataPart] = result.split(';base64,');
      if (!mimePart || !dataPart) {
          reject(new Error("Invalid file format for base64 conversion."));
          return;
      }
      const mimeType = mimePart.split(':')[1];
      if (!mimeType) {
          reject(new Error("Could not determine mimeType from file."));
          return;
      }
      resolve({ mimeType, data: dataPart });
    };
    reader.onerror = (error) => reject(error);
  });
};
