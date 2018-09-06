import * as Papa from 'papaparse';
import * as numeral from 'numeral';

function upload(formData) {
    const photos = formData.getAll('photos');
    //console.log(photos)

    const promises = photos.map((x) => getImage(x)
        .then(img => ({
            id: img,
            originalName: x.name,
            fileName: x.name,
            url: img
        })));
    return Promise.all(promises);
}

function getImage(file) {
    return new Promise((resolve, reject) => {
        const fReader = new FileReader();
        const img = document.createElement('img');

        fReader.readAsDataURL(file);

        //file ingelezen
        Papa.parse(file, { header: true,
            complete: function(results) {
                console.log("Finished:", results.data);
                cleanData(results.data)
            }
        });



        fReader.onload = () => {
            img.src = fReader.result;
            resolve(getBase64Image(img));
        }

        
    })
}

function getBase64Image(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const dataURL = img.src;
    return dataURL;
}

function cleanData(data) {
    const cleanedData = []
    for (const row of data) 
        //voor elke row in de array
    {
        const tempRow = {}
        tempRow.tradeTimeStamp = new Date(row.Trade_Date)
        var tempCur = ''
        tempCur.concat(row.Buy_Cur,"-",row.Sell_Cur)
        tempRow.currency = tempCur
        tempRow.quantity = numeral(row.Buy_Amount).value()
        //tempRow.rate = 

        console.log(tempRow)




    }
    //console.log(cleanedData)


}

export { upload }

