
let tableData =[];
const currentDate = new Date();
const modal = document.getElementById('modalContainer');
const dateInput = document.getElementById('dateTimeInp');
const loader = document.getElementById('loader');
const base_url = `https://api.coingecko.com/api/v3/coins/bitcoin`;
const error_msg = 'Please enter valid date format in MM/DD/YYYY HH:mm format';
const api_error_msg = 'Something went wrong!! Please try again later.'


/**function for formatting date */
function getFormattedDate(dateObj){
    const dateVal = dateObj
    const yyyy = dateVal.getFullYear();
    let mm = `${dateVal.getMonth() + 1}`; // month is zero-based
    let dd = dateVal.getDate();

    if (dd < 10) dd = `0${dd}`;
    if (mm < 10) mm = `0${mm}`;

    const formatted = `${mm}-${dd}-${yyyy}`;
    return formatted;
}

function formArrayOfObj(datObj,bitCoinVal) {
    tableData = [...tableData,
        {
            dateVal : datObj,
            bitCoinValue : bitCoinVal
        }
    ];
    return tableData;
}

/**function for table structure */
function generateTableStructure(data){
    return data.map(item => {
        return(
            `<tr>
                <td>${item.dateVal} 20:00</td>
                <td>${item.bitCoinValue}</td>
            </tr>`
        )
    }).join('')
}

/**function for generating modals */
function getModal(message = `Invalid date format!!  ${error_msg}`){
    const modalContent = 
        `<div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <div class="message">${message}</div>
        </div>`
    modal.innerHTML = modalContent;
    modal.style.display = 'block';
}

function closeModal(){
    modal.style.display = 'none';
    dateInput.value = '';
    dateInput.focus();
}

/**function for predicting dra price */
function getPredictedDrawPrice(drawDate){
    let computedDrawDate = drawDate;
    let predictedPrice = '-';
    const currentYear = currentDate.getFullYear();
    let prevYear = currentYear - 1;
    if(computedDrawDate.split('-')[0] < currentDate.getMonth()+1){
        prevYear = currentYear;
    }
    const prevDateFromCurrDate = `${currentDate.getDate()}-${currentDate.getMonth()+1}-${prevYear}`;
    let prevDateFromCurrDate1 = null;
    if(prevYear == currentYear){
        prevDateFromCurrDate1 = `${currentDate.getDate()}-${currentDate.getMonth()+1}-${currentYear - 1}`;
    }
    const prevDateFromDrawDate = `${computedDrawDate.split('-')[1]}-${computedDrawDate.split('-')[0]}-${prevYear}`
    makeAPICalls(prevDateFromCurrDate , prevDateFromDrawDate, prevDateFromCurrDate1).then((responses) => {
        if(responses.length && responses.length >= 3){
            const currentBitcoinPrice = responses[0];
            const prevBTCFromCurrDate = responses[1];
            const prevBTCFromDrawDate = responses[2];
            const prevoiusBTPrice = responses[3] || prevBTCFromCurrDate;
            if(currentBitcoinPrice && prevBTCFromCurrDate && prevBTCFromDrawDate){
                let monthlyROI = ((prevBTCFromDrawDate / prevBTCFromCurrDate ) - 1 ) * 100;
                if(computedDrawDate.split('-')[0] < currentDate.getMonth()+1){
                    monthlyROI = ((prevBTCFromCurrDate / prevBTCFromDrawDate ) - 1 ) * 100;;
                }
                const yearlyROI =  ((currentBitcoinPrice / prevoiusBTPrice) - 1) * 100;
                let noOfYears = 1;
                if(computedDrawDate.split('-')[2] !== currentYear)
                noOfYears =  computedDrawDate.split('-')[2] - currentYear;
                const totalROI = monthlyROI + (yearlyROI * noOfYears);
                const predictedDP = currentBitcoinPrice + ( currentBitcoinPrice * (totalROI / 100));
                const predictedROI = ((currentBitcoinPrice - predictedDP ) / predictedDP ) * 100;
                predictedPrice = 100 + predictedROI;
                predictedPrice = `€ ${parseFloat(predictedPrice).toFixed(2)}`;
            }
            
            const formattedData = formArrayOfObj(drawDate,predictedPrice);
            loader.style.display = 'none';
            document.getElementById("tableBody").innerHTML = generateTableStructure(formattedData);
        }
    })
    .catch((error) => {
        getModal(api_error_msg);
        loader.style.display = 'none';
        const formattedData = formArrayOfObj(drawDate,predictedPrice);
        document.getElementById("tableBody").innerHTML = generateTableStructure(formattedData);
    })
}

function onSubmit(){
    if(isValidDate(dateInput.value)){
        //show the draw date in the table
        const dateObj = getFormattedDate(getNextLottoDraw(dateInput.value));
        loader.style.display = 'block';
        getPredictedDrawPrice(dateObj)
    }
}

function getNextLottoDraw(inputDate){
    let dateCopy = new Date(inputDate);
    /*check if input date is past date*/
    // Compare the input date with the current date
    if (dateCopy < currentDate) {
        dateCopy = new Date(currentDate);
    }
    const day = dateCopy.getDay(); // returns 0 to 6 
    if(day < 3 || (day === 3 && dateCopy.getHours() < 20) ||
        (day === 3 && dateCopy.getHours() === 20 && dateCopy.getMinutes() === 0)){
            noOfDaysToAdd = (6 - day) - 3;
    }else if(day === 6 && (dateCopy.getHours() > 20 ) || (dateCopy.getHours() === 20 && dateCopy.getMinutes() > 0)){
        noOfDaysToAdd = 4;
    } else{
        noOfDaysToAdd = 6 - day;
    }
    dateCopy.setDate(dateCopy.getDate() + noOfDaysToAdd)
    return new Date(dateCopy);
}

function isValidDate(dateInp){
    const inputDate = dateInp;
    if(!inputDate) {
        getModal(`Input field cannot be empty!!!${error_msg}`);
        return false;
    }
    else {
        let splitArr = inputDate.split(' ');
        /*check for HH:mm is valid*/
        if(splitArr?.length && splitArr.length > 1){
            let timePartArr = splitArr[1];
            if(timePartArr){
                const timeSplitArr = timePartArr.split(':');
                const hrPart = timeSplitArr?.length ? timeSplitArr[0] : null;
                if(hrPart && Number(isNaN(hrPart)) || Number(hrPart) > 24 || hrPart.length > 2){
                    getModal();
                    return false;
                }
                const mmPart = timeSplitArr?.length && timeSplitArr.length > 1 ? timeSplitArr[1] : null;
                if(mmPart && Number(isNaN(mmPart)) || Number(mmPart) > 59 || mmPart.length > 2){
                    getModal();
                    return false;
                }
                if(hrPart && Number(hrPart) === 24 && mmPart && Number(mmPart) > 0){
                    getModal();
                    return false;
                }
            }
        }

        /*check for MM/DD/YYYY is valid*/
        let dateformat = /^(0?[1-9]|1[0-2])[\/](0?[1-9]|[1-2][0-9]|3[01])[\/]\d{4}$/;

        // Matching the date through regular expression      
        if (splitArr[0].match(dateformat)) {
            let operator = splitArr[0].split('/');

            // Extract the string into month, date and year      
            let datepart = [];
            if (operator.length > 1) {
                datepart = splitArr[0].split('/');
            }
            let month = parseInt(datepart[0]);
            let day = parseInt(datepart[1]);
            let year = parseInt(datepart[2]);

            // Create a list of days of a month      
            let listofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (month == 1 || month > 2) {
                if (day > listofDays[month - 1]) {
                    //to check if the date is out of range 
                    getModal();   
                    return false;
                }
            } else if (month == 2) {
                let leapYear = false;
                if ((!(year % 4) && year % 100) || !(year % 400)) leapYear = true;
                if ((leapYear == false) && (day >= 29)){
                    getModal();
                    return false;
                } 
                else
                    if ((leapYear == true) && (day > 29)) {
                        getModal();
                        return false;
                    }
            }
        } 
        else {
            getModal();
            return false;
        }
        return true;
    }
}

function onInput(event){
    if(event.key === 'Enter'){
        document.getElementById('submitBtn').click()
    }
}

async function getCurrentBitcoinPrice(){
    const response = await fetch(`${base_url}`);
    if(response.status === 200){
        const data = await response.json();
        const bitcoinValue = data?.market_data?.current_price?.eur || null;
        return bitcoinValue;
    }else{
        getModal(api_error_msg);
    }
}

async function getHistoricalBitcoinPrice(dateInput){
    const response = await fetch(`${base_url}/history?date=${dateInput}`);
    if(response.status === 200){
        const data = await response.json();
        const historicalVal = data?.market_data?.current_price?.eur || null;
        return historicalVal;
    }else{
        getModal(api_error_msg);
    }
}

async function makeAPICalls(date1,date2,date3){
    const responses = await Promise.all([
        getCurrentBitcoinPrice(),
        getHistoricalBitcoinPrice(date1),
        getHistoricalBitcoinPrice(date2),
        date3 && getHistoricalBitcoinPrice(date3)
    ]);
    return responses;
}