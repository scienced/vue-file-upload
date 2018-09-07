<template>
  <div id="app">
    <div class="container">
      <!--UPLOAD-->
      <form enctype="multipart/form-data" novalidate v-if="isInitial || isSaving">
        <h1>Upload CSV</h1>
        <div class="dropbox">
          <input type="file" multiple :name="uploadFieldName" :disabled="isSaving" @change="filesChange($event.target.name, $event.target.files); fileCount = $event.target.files.length"
            accept="text/csv" class="input-file">
            <p v-if="isInitial">
              Drag your csv file(s) here to begin<br> or click to browse
            </p>
            <p v-if="isSaving">
              Uploading {{ fileCount }} files...
            </p>
        </div>
      </form>
      <!--SUCCESS-->
      <div v-if="isSuccess">
        <h2>Upload successfully.</h2>
        <p>
          <a href="javascript:void(0)" @click="reset()">Upload again</a>
        </p>
        <ul class="list-unstyled">
          <li v-for="item in uploadedFiles">
            {{item.originalName}} ({{item.csvParse.data.length}} rows)<br>
            {{parseInfo}} <br>
            <br>

            Found {{cleanedData.length}} good trades between dates: <strong>{{minDate | moment("DD-MM-YYYY")}} </strong> and <strong>{{maxDate | moment("DD-MM-YYYY")}}</strong>
            <br>

            <ul>
            <li v-for="book in books">{{ book }}</li>
            </ul>




           

            //todo




         

          </li>
        </ul>
      </div>
      <!--FAILED-->
      <div v-if="isFailed">
        <h2>Uploaded failed.</h2>
        <p>
          <a href="javascript:void(0)" @click="reset()">Try again</a>
        </p>
        <pre>{{ uploadError }} {{parseInfo}}</pre>

      </div>
    </div>
  </div>
</template>

<script>
  // swap as you need
  import { upload } from './file-upload.fake.service'; // fake service
  // import { upload } from './file-upload.service';   // real service
  //import { wait } from './utils';
  import moment from 'moment';
  import numeral from 'numeral';


  const STATUS_INITIAL = 0, STATUS_SAVING = 1, STATUS_SUCCESS = 2, STATUS_FAILED = 3;

  export default {
    name: 'app',
    data() {
      return {
        uploadedFiles: [],
        uploadError: null,
        currentStatus: null,
        parseInfo: null,
        uploadFieldName: 'photos',
        //csv info
        maxDate: new Date('2000-01-01'),
        minDate: new Date(),
        cleanedData: [],
        books: []
        
      }
    },
    computed: {
      isInitial() {
        return this.currentStatus === STATUS_INITIAL;
      },
      isSaving() {
        return this.currentStatus === STATUS_SAVING;
      },
      isSuccess() {
        return this.currentStatus === STATUS_SUCCESS;
      },
      isFailed() {
        return this.currentStatus === STATUS_FAILED;
      },
     
    },
    methods: {
      reset() {
        // reset form to initial state
        this.currentStatus = STATUS_INITIAL;
        this.uploadedFiles = [];
        this.uploadError = null;
        this.parseInfo = null;
        this.cleanedData = [];
        this.maxDate = new Date('2000-01-01')
        this.minDate = new Date()
        this.books = null
      },


      save(formData) {
        // upload data to the server

        this.currentStatus = STATUS_SAVING;

       
        upload(formData)
          //.then(wait(1500)) // DEV ONLY: wait for 1.5s 
          .then(x => {
            this.uploadedFiles = [].concat(x);
            this.currentStatus = STATUS_SUCCESS;
            this.checkParse()
            this.prepData()
          })
         // .catch(err => {
         //   console.log(err)
         //   this.uploadError = err.response;
         //   this.currentStatus = STATUS_FAILED;
         // });


      },
      filesChange(fieldName, fileList) {
        // handle file changes
        const formData = new FormData();

        if (!fileList.length) return;

        // append the files to FormData
        Array
          .from(Array(fileList.length).keys())
          .map(x => {
            formData.append(fieldName, fileList[x], fileList[x].name);
          });

        // save it
        this.save(formData);
      },

      checkParse () {

        //check if number of columns is 16
        //console.log(this.uploadedFiles[0].csvParse.meta.fields.length)
        if (this.uploadedFiles[0].csvParse.meta.fields.length != 16) { 
          this.parseInfo = "not 16 headers"
          this.currentStatus = STATUS_FAILED;
          return }

        //check if column names & order are the same
        //console.log(this.uploadedFiles[0].csvParse.meta.fields)
        const goodHeaders = ["Trade_Date", "Value_Date", "Buy_Amount", "Rate", "Reference", "Funding_Bank", "Beneficiary", "Trade_Type", "Buy_Cur", "Sell_Amount", "Sell_Cur", "Split_Amount", "Currency", "Funding_Bank", "Split_No", "Non_USD_Beneficiary"]

        if(console.log(this.uploadedFiles[0].csvParse.meta.fields.every(function(value, index) { return value === goodHeaders[index]}))==false){
          this.parseInfo = "not correct named or ordered 16 headers"
          this.currentStatus = STATUS_FAILED;
          return
        }
        //check if there are errors
        //console.log(this.uploadedFiles[0].csvParse.errors.length)
         if (this.uploadedFiles[0].csvParse.errors.length != 0) { 
          this.parseInfo = "csv parse found errors in the file"
          this.currentStatus = STATUS_FAILED;
          return }

        //parse aborted
        //console.log(this.uploadedFiles[0].csvParse.meta.aborted)
         if (this.uploadedFiles[0].csvParse.meta.aborted == true) { 
          this.parseInfo = "csv parse aborted"
          this.currentStatus = STATUS_FAILED;
          return }

        //minium date en maximimum date:

        this.parseInfo = "CSV format is recognised"

        //start prepping the array
        //this.prepData()

      },

      prepData () {

         // console.log("prepdata functie")
         // console.log(moment.now());

         if (this.currentStatus == 'STATUS_FAILED') {return}

          

          numeral.locale('nl2');
          

           for (const row of this.uploadedFiles[0].csvParse.data) 
              {
                const tempRow = {}

                  //trade date
                  //tempRow.nldate = row.Trade_Date
                  tempRow.tradeTimeStamp = moment.utc(row.Trade_Date, "DD MMM YY", 'nl')
                  //find max date
                  if(tempRow.tradeTimeStamp>this.maxDate) {this.maxDate = tempRow.tradeTimeStamp}
                  //find min date
                  if(tempRow.tradeTimeStamp<this.minDate) {this.minDate = tempRow.tradeTimeStamp}
                  tempRow.tradeTimeStamp = tempRow.tradeTimeStamp.toISOString()

                  //trader
                  //loopup book in books table

                  //trade type
                  tempRow.tradeType = 'CASH'

                  //rate
                  tempRow.rate = numeral(row.Rate).value()

                  //veloci id
                  tempRow.reference = row.Reference
                  tempRow.refShort = row.Reference.slice(-2)

                  //boek - fixen
                  const bookId = row.Beneficiary.match(/[ML]{2}\d{6}/g)
                  tempRow.bookId = bookId[0]


                  const currency = row.Buy_Cur + '-' + row.Sell_Cur
                  //  lookup currency in currency tabel. buy_ammount as base currency else: negative sell_ammount is de base cuurency
                  tempRow.currency = row.Buy_Cur + '-' + row.Sell_Cur
                  tempRow.quantity = numeral(row.Buy_Amount).value()
                  tempRow.counterQuantity = numeral(row.Sell_Amount).value()*-1
                  tempRow.buysell = 'BUY'

                 //counterparty
                 if(tempRow.refShort == '.2' || tempRow.refShort == '.3') {
                  tempRow.counterParty = 'Options'
                 } else if (tempRow.refShort == '.1') {tempRow.counterParty = 'Currenex'}


                if(tempRow.refShort == '.2' || tempRow.refShort == '.1' || tempRow.refShort == '.3') {
                this.cleanedData.push(tempRow)
                }
              }


        const count = this.cleanedData.reduce( (tally, val) => {
        tally[val.bookId] = (tally[val.bookId] || 0) + 1 ;
        this.books = tally;
      } , {})
      
       
        }


    },
    mounted() {
      this.reset();

      numeral.register('locale', 'nl2', {
                      delimiters: {
                          thousands: '.',
                          decimal: ','
                      },
                      abbreviations: {
                          thousand: 'k',
                          million: 'm',
                          billion: 'b',
                          trillion: 't'
                      },
                      ordinal : function (number) {
                          return number === 1 ? 'er' : 'ème';
                      },
                      currency: {
                          symbol: '€'
                      }
                  });

    },
  }

</script>

<style lang="scss">
  .dropbox {
    outline: 2px dashed grey; /* the dash box */
    outline-offset: -10px;
    background: lightcyan;
    color: dimgray;
    padding: 10px 10px;
    min-height: 200px; /* minimum height */
    position: relative;
    cursor: pointer;
  }
  
  .input-file {
    opacity: 0; /* invisible but it's there! */
    width: 100%;
    height: 200px;
    position: absolute;
    cursor: pointer;
  }
  
  .dropbox:hover {
    background: lightblue; /* when mouse over to the drop zone, change color */
  }
  
  .dropbox p {
    font-size: 1.2em;
    text-align: center;
    padding: 50px 0;
  }
</style>