document.getElementById('processBtn').addEventListener('click', processFile);

function processFile() {
    const fileInput = document.getElementById('fileInput');
    const output = document.getElementById('output');
    
    if (fileInput.files.length === 0) {
        output.textContent = 'Please select a file first.';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let processedContent;
            
            if (file.name.endsWith('.txt')) {
                processedContent = processTextFile(content);
            } else if (file.name.endsWith('.csv')) {
                processedContent = processCSVFile(content);
            } else if (file.name.endsWith('.json')) {
                processedContent = processJSONFile(content);
            } else if (file.type.startsWith('image/')) {
                processImageFile(file)
                    .then(info => {
                        output.textContent = info;
                    })
                    .catch(error => {
                        output.textContent = `Error processing image: ${error.message}`;
                    });
                return;
            } else if (file.name.endsWith('.pdf')) {
                processPDFFile(file)
                    .then(info => {
                        output.textContent = info;
                    })
                    .catch(error => {
                        output.textContent = `Error processing PDF: ${error.message}`;
                    });
                return;
            } else {
                throw new Error('Unsupported file type');
            }

            output.textContent = processedContent;
        } catch (error) {
            output.textContent = `Error processing file: ${error.message}`;
        }
    };

    reader.onerror = function() {
        output.textContent = 'Error reading file. Please try again.';
    };

    reader.readAsText(file);
}

function processTextFile(content) {
    const lines = content.split('\n');
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    return `Text File Analysis:\nLines: ${lines.length}\nWords: ${wordCount}\n\nContent:\n${content}`;
}

function processCSVFile(content) {
    const rows = content.split('\n');
    const table = rows.map(row => {
        const cells = row.split(',');
        return cells.join(' | ');
    }).join('\n');
    return `CSV Content:\n${table}`;
}

function processJSONFile(content) {
    const json = JSON.parse(content);
    return `JSON Content:\n${JSON.stringify(json, null, 2)}`;
}

function processImageFile(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = function() {
            const info = `Image Information:\n
            Name: ${file.name}\n
            Type: ${file.type}\n
            Size: ${(file.size / 1024).toFixed(2)} KB\n
            Dimensions: ${img.width}x${img.height} pixels\n
            Last Modified: ${new Date(file.lastModified).toLocaleString()}`;
            
            URL.revokeObjectURL(img.src);
            resolve(info);
        };
        
        img.onerror = function() {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };
    });
}

function processPDFFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const pdfData = new Uint8Array(e.target.result);
            pdfjsLib.getDocument({data: pdfData}).promise
                .then(pdf => {
                    let info = `PDF Information:\n
                    Name: ${file.name}\n
                    Type: ${file.type}\n
                    Size: ${(file.size / 1024).toFixed(2)} KB\n
                    Pages: ${pdf.numPages}\n
                    Last Modified: ${new Date(file.lastModified).toLocaleString()}`;
                    
                    resolve(info);
                })
                .catch(error => {
                    reject(new Error('Failed to process PDF: ' + error.message));
                });
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read PDF file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

document.getElementById('convertBtn').addEventListener('click', convertFile);

function convertFile() {
    const fileInput = document.getElementById('fileInput');
    const output = document.getElementById('output');
    const convertType = document.getElementById('convertType').value;
    
    if (fileInput.files.length === 0) {
        output.textContent = 'Please select a file first.';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
        reader.onload = function(e) {
            try {
                const img = new Image();
                img.src = e.target.result;
                
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    let convertedData;
                    switch(convertType) {
                        case 'jpg':
                            convertedData = canvas.toDataURL('image/jpeg', 0.9);
                            break;
                        case 'png':
                            convertedData = canvas.toDataURL('image/png');
                            break;
                        case 'webp':
                            convertedData = canvas.toDataURL('image/webp', 0.9);
                            break;
                        default:
                            throw new Error('Unsupported image format');
                    }
                    
                    downloadFile(convertedData, convertType);
                    output.textContent = `Image converted to ${convertType} successfully!`;
                };
            } catch (error) {
                output.textContent = `Error converting image: ${error.message}`;
            }
        };
        reader.readAsDataURL(file);
    } else {
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                let convertedContent;
                
                if (file.name.endsWith('.txt')) {
                    convertedContent = convertFromText(content, convertType);
                } else if (file.name.endsWith('.csv')) {
                    convertedContent = convertFromCSV(content, convertType);
                } else if (file.name.endsWith('.json')) {
                    convertedContent = convertFromJSON(content, convertType);
                } else {
                    throw new Error('Unsupported file type');
                }

                downloadFile(convertedContent, convertType);
                output.textContent = `File converted to ${convertType} successfully!\n\n${convertedContent}`;
            } catch (error) {
                output.textContent = `Error converting file: ${error.message}`;
            }
        };
        reader.readAsText(file);
    }
}

function downloadFile(content, fileType) {
    let blob;
    if (fileType === 'jpg' || fileType === 'png' || fileType === 'webp') {
        const byteString = atob(content.split(',')[1]);
        const mimeString = content.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        blob = new Blob([ab], { type: mimeString });
    } else {
        blob = new Blob([content], { type: 'text/plain' });
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_file.${fileType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function convertFromText(content, targetType) {
    switch(targetType) {
        case 'csv':
            return content.split('\n').map(line => `"${line}"`).join('\n');
        case 'json':
            return JSON.stringify({ content: content.split('\n') }, null, 2);
        default:
            return content;
    }
}

function convertFromCSV(content, targetType) {
    const rows = content.split('\n');
    switch(targetType) {
        case 'txt':
            return rows.join('\n');
        case 'json':
            const data = rows.map(row => {
                const cells = row.split(',');
                return cells.reduce((obj, cell, index) => {
                    obj[`column${index + 1}`] = cell;
                    return obj;
                }, {});
            });
            return JSON.stringify(data, null, 2);
        default:
            return content;
    }
}

function convertFromJSON(content, targetType) {
    const json = JSON.parse(content);
    switch(targetType) {
        case 'txt':
            return JSON.stringify(json);
        case 'csv':
            if (Array.isArray(json)) {
                return json.map(obj => Object.values(obj).join(',')).join('\n');
            }
            return Object.entries(json).map(([key, value]) => `${key},${value}`).join('\n');
        default:
            return content;
    }
}
