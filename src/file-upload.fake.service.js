import * as Papa from 'papaparse';
import * as numeral from 'numeral';


function upload(formData) {
    const photos = formData.getAll('photos');
    //console.log(photos)

    const promises = photos.map((x) => getImage(x)
        .then(img => ({
            csvParse: img,
            originalName: x.name,
            fileName: x.name,
        })));
    return Promise.all(promises);
}

function getImage(file) {
    return new Promise((resolve, reject) => {
        //const fReader = new FileReader();
        //const img = document.createElement('img');

        //fReader.readAsDataURL(file);

        //file ingelezen
        Papa.parse(file, { header: true, skipEmptyLines: true,
            complete: function(results) {
                console.log("Finished:", results);
                //cleanData(results.data)
                resolve(results)
            },
            error: function(errors) {
                console.log("errors:", errors);
            }
        });

        
    })
}


function cleanData(data) {
    const cleanedData = []
    for (const row of data) 
        //voor elke row in de array
    {
        const tempRow = {}
        tempRow.tradeTimeStamp = new Date(row.Trade_Date)
        tempRow.tradeTimeStamp.toString()


        tempRow.currency = row.Buy_Cur + "-" + row.Sell_Cur
        tempRow.quantity = numeral(row.Buy_Amount).value()
        //tempRow.rate = numeral(row.Buy_Amount).value()

        console.log(tempRow)




    }
    return cleanedData


}

export { upload }

