


loginCgiAddr = '/cgi-bin/loading.cgi';
myUrl = 'http://hnomka.dlinkddns.com';
topicPageNumber = 1;
inTopicPage = 1;
replyPageNumber = 1;
currentGroupId = 0;


submitTitle = "";
submitContent ="";
replyContent = "";
currentTopicId = "";
currentSearchString = "";

setInterval(function() {myTimer()},180000);
selectMethod = "post";
function myTimer(){
    exeStatement("func=updateLoginStatus");
}

function initPage() {
    loadPage("func=loadStatusTable", "topbar");
    loadPage("func=loadSearchTable", "searchContent");
    var query = window.location.search.substring(1);
    var s = query.split("&");
    myTimer();
    if (s.length == 1){
        var pair = s[0].split("=");
        if (pair[0]=='groupId'){
            loadGroup(pair[1]);
            return;
        }
    }
    else if (s.length == 2){
        var pair1 = s[0].split("=");
        var pair2 = s[1].split("=");
        if (pair1[0] == 'groupId' && pair2[0]=='topicId'){
            loadTopic(pair1[1], pair2[1]);
            return;
        }
        if (pair1[0] == 'groupId' && pair2[0]=='search'){
            loadSearch(pair1[1], pair2[1]);
            return;
        }
    }
    loadMainPage();
};

function loadMainPage(){
    currentGroupId = 0;
    inTopicPage = 1;
    topicPageNumber = 1;
    loadPage("func=loadMainPage","mainContent");
    loadPage("func=loadGroupList", "groupListdiv");
}

function goMainPage(){
    window.location.href = myUrl;
}

function openTopic(groupId, topicId){
    exeStatement("func=setTopicPage&topicPage="+topicPageNumber);
    window.location.href = myUrl+"?groupId=" +groupId +"&topicId=" + topicId;
    
}

function loadSearch(groupId,searchKey){
    currentSearchString = searchKey;
    currentGroupId = groupId;
    inTopicPage = 2;
    topicPageNumber = 1;
    loadPage("func=loadMainTopicPage&groupId="+currentGroupId, "mainContent");
    loadPageSelector(currentGroupId,2);
    document.getElementById("postdiv").innerHTML = "";
    loadSearchList();
}

function loadSearchList(){
    var str = "func=loadSearchList";
    str += "&searchKey=" + currentSearchString;
    str += "&selector=" + selectMethod;
    str += "&currentGroup=" + currentGroupId;
    str += "&currentPage=" + topicPageNumber;
    loadPage(str, "topicListdiv");
    
}

function editInfo(){
    loadPage ("func=loadEditTable","mainContent");
}

function loadTopic(groupId,topicId){
    currentGroupId = groupId;
    currentTopicId = topicId;
    inTopicPage = 0;
    replyPageNumber = 1;
    loadPage("func=loadReplyPage&topicId=" + topicId +"&groupId=" + groupId, "mainContent");
    loadPageSelector(topicId,0);
    loadPage("func=loadNewReplyButton", "replydiv");
    loadReplyList(topicId);
}

function openGroup(groupId){
    window.location.href = myUrl+"?groupId=" +groupId;
}

function loadGroup(groupId){
    currentGroupId = groupId;
    inTopicPage = 1;
    loadPage("func=loadMainTopicPage&groupId="+currentGroupId, "mainContent");
    loadPageSelector(currentGroupId,1);
    if (groupId == 0){
        document.getElementById("postdiv").innerHTML = "";
    }else{
        loadPage("func=loadNewTopicButton", "postdiv");
    }
    loadTopicList();
}


function loadReplyList(topicId){
    var str = "func=loadReplyList";
    str += "&currentPage=" + replyPageNumber;
    str += "&topicId=" + topicId;
    loadPage(str, "replyListdiv");
}

function backToTopic(groupId){
    window.location.href = myUrl+"?groupId=" +groupId;
}

function loadPageSelector(Id,type){
    var xmlHttpReq = false;
    var self = this;
    if (window.XMLHttpRequest){ // code for IE7+, Firefox, Chrome, Opera, Safari
        self.xmlhttp = new XMLHttpRequest();
    }else{ // code for IE6, IE5
        self.xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    var xmlHttpReq = false;
    var self = this;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
        self.xmlHttpReq = new XMLHttpRequest();
    }
    else if (window.ActiveXObject) {// code for IE6, IE5
        self.xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");
    }
    self.xmlHttpReq.open('POST', loginCgiAddr, false);
    self.xmlHttpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    self.xmlHttpReq.onreadystatechange = function() {
        if (self.xmlHttpReq.readyState == 4) {
            document.getElementById('pageSelector1div').innerHTML = self.xmlHttpReq.responseText;
            document.getElementById('pageSelector2div').innerHTML = self.xmlHttpReq.responseText;
        }
    }
    
    var str = "func=loadPageSelector";
    str += "&currentPage=" + (inTopicPage ? topicPageNumber : replyPageNumber);
    str += "&type=" + type;
    str += "&Id=" + Id;
    str += "&searchKey=" + currentSearchString;
    self.xmlHttpReq.send(str);
}

function loadTopicList(){
    //var selector = document.getElementById("OrderSelect");
    
    var str = "func=loadTopicList";
    str += "&selector=" +selectMethod;
    str += "&currentPage=" + topicPageNumber;
    str += "&currentGroup=" + currentGroupId;
    loadPage(str, "topicListdiv");
}

function loadLoginBar(){
    loadPage("func=loadLoginTable", "topbar");
}

function loadStatusBar(){
    loadPage("func=loadStatusBar", "topbar");
}

function loadWelcomePage(){
    loadPage("func=loadWelcomePage", "mainContent");
}

function loadRegistBar(){
    loadPage("func=loadRegistBar", "mainContent");
}

function changePassword(){
    var form = document.forms["editForm"];
    for ( var i = 0; i < form.newPassword.value.length; i++){
        var length=escape(form.newPassword.value.charAt(i)).length;
        if (length >= 4){
            alert("新しいパスワードを半角文字使ってください");
            form.newPassword.value = "";
            form.newPassword2.value = "";
            return;
        }
    }
    if (form.oldPassword.value.length == ""){
        form.newPassword.value = "";
        form.newPassword2.value = "";
        
    }
    else if(form.newPassword.value != form.newPassword2.value){
        alert("新しいパスワードが一致しません");
        form.newPassword.value = "";
        form.newPassword2.value = "";
    }
    else if (form.newPassword.value.length < 6){
        if (form.newPassword.value.length == ""){
            alert("新しいパスワードを入力してください");
        }else{
            alert("新しいパスワードが短いすぎる");
        }
        form.newPassword.value = "";
        form.newPassword2.value = "";
    }else if (form.newPassword.value.length > 32){
        alert("新しいパスワードが長いすぎる");
        form.newPassword.value = "";
        form.newPassword2.value = "";
    }else{
        var str = "func=changePassword";
        str += "&oldPassword="+ sha1(form.oldPassword.value);
        str += "&newPassword="+ sha1(form.newPassword.value);
        str += "&newPassword2="+ sha1(form.newPassword2.value);
        loadPage(str, "mainContent");
    }
}



function registration(){
    var form = document.forms["regist_form"];
    for ( var i = 0; i < form.password.value.length; i++){
        var length=escape(form.password.value.charAt(i)).length;
        if (length >= 4){
            alert("パスワードを半角文字使ってください");
            form.password.value = "";
            form.password2.value = "";
            return;
        }
    }
    for ( var i = 0; i < form.user_name.value.length; i++){
        var length=escape(form.user_name.value.charAt(i)).length;
        if (length >= 4){
            alert("お名前を半角文字使ってください");
            form.user_name.value = "";
            form.password.value = "";
            form.password2.value = "";
            return;
        }
    }
    for ( var i = 0; i < form.user_name.value.length; i++){
        var length=escape(form.user_name.value.charAt(i)).length;
        if (length >= 4){
            alert("メールアドレスはじゃありません");
            form.mail_address.value = "";
            form.password.value = "";
            form.password2.value = "";
            return;
        }
    }
    
	if(form.password.value != form.password2.value){
        alert("パスワードが一致しません");
        form.password.value = "";
        form.password2.value = "";
    }
    else if (form.password.value.length < 6){
        if (form.password.value.length == ""){
            alert("パスワードを入力してください");
        }else{
            alert("パスワードが短いすぎる");
        }
        form.password.value = "";
        form.password2.value = "";
    }else if (form.password.value.length > 32){
        alert("パスワードが長いすぎる");
        form.password.value = "";
        form.password2.value = "";
    }
    else if (form.user_name.value == ""){
        alert("お名前を入力してください");
    }else if (form.user_name.value.length > 20){
        alert("お名前が長すぎる");
    }else if (form.mail_address.value.length > 200){
        alert("メールアドレスが長過ぎる");
    }
    else
    {
        var str = "func=registration";
        str += "&username="+ form.user_name.value;
        str += "&email="+ form.mail_address.value;
        str += "&password="+ sha1(form.password.value);
        str += "&password2="+ sha1(form.password2.value);
        loadPage(str, "mainContent");
        loadPage("func=loadStatusTable", "topbar");
    }
}

function deleteTopic(topicId){
    ans = confirm("このトッピグ " +topicId+ " を削除します、よろしいですか");
    if (ans){
        exeStatement("func=deleteTopic&topicId=" + topicId);
        loadTopicList();
    }
}


function deleteReply(replyId){
    ans = confirm("この返信 " + replyId+ " を削除します、よろしいですか");
    if (ans){
        exeStatement("func=deleteReply&replyId=" + 　replyId);
        loadReplyList();
    }
}


function logout(){
    loadPage("func=logout","");
    window.location.href = myUrl;
}

function newTopic(){
    loadPage("func=loadNewTopic","postdiv");
}

function newReply(){
    loadPage("func=loadNewReply","replydiv");
    scrollToPageBottom();
}

function submitReply(){
    replyContent = document.getElementById("replyContentTextarea").value;
    if (replyContent == ""){
        alert("返信を入力してください");
        return;
    }else if(replyContent.length >= 10000){
        alert("文章が長すぎる、10000字以内でお願いします");
        return;
    }
    var str = "func=submitReply";
    str += "&content=" + replyContent;
    loadPage(str, "replydiv");
}

function cancelSubmitReply(){
    
    var ans = 1;
    replyContent = document.getElementById("replyContentTextarea").value;
    if (replyContent != ""){
        ans = confirm("入力した内容が削除されます、よろしいですか");
    }
    if (ans){
        loadPage("func=loadNewReplyButton", "replydiv");
        replyContent = "";
    }
    
}

function submitTopic(){
    submitTitle = document.getElementById("topicTitleTextbox").value;
    submitContent = document.getElementById("topicContentTextarea").value;
    if (submitTitle == ""){
        alert("タイトルを入力してください");
        return;
    }else if (submitTitle.length > 200){
        alert("タイトルが長過ぎる、200字以内でお願いします");
        return;
    }
    
    if (submitContent == ""){
        alert("内容を入力してください");
        return;
    }else if(submitContent.length >= 10000){
        alert("文章が長すぎる、10000字以内でお願いします");
        return;
    }
    var str = "func=submitTopic";
    str += "&title=" + submitTitle;
    str += "&content=" + submitContent;
    loadPage(str, "postdiv");
}

function cancelSubmitTopic(){
    var ans = 1;
    submitTitle = document.getElementById("topicTitleTextbox").value;
    submitContent = document.getElementById("topicContentTextarea").value;
    if (submitTitle != "" || submitContent != ""){
        ans = confirm("入力した内容が削除されます、よろしいですか");
    }
    if (ans){
        loadPage("func=loadNewTopicButton", "postdiv");
        submitTitle = "";
        submitContent = "";
    }
}

function goPage(pageNumber){
    if (inTopicPage == 1){
        topicPageNumber = pageNumber;
        loadPageSelector(currentGroupId,1);
        loadTopicList();
    }else if (inTopicPage == 2){
        topicPageNumber = pageNumber;
        loadPageSelector(currentGroupId,2);
        loadSearchList();
    }
    else{
        replyPageNumber = pageNumber;
        loadPageSelector(currentTopicId);
        loadReplyList(currentTopicId,0);
    }
}

function postTopicConfirm(){
    var str = "func=postTopicConfirm";
    str += "&title=" + submitTitle;
    str += "&content=" + submitContent;
    str += "&groupId=" + currentGroupId;
    loadPage(str,"topbar"); // need to change
    topicPageNumber = 1;
    loadPageSelector(currentGroupId,1);
    loadPage("func=loadNewTopicButton", "postdiv");
    loadTopicList();
}

function postReedit(){
    loadPage("func=loadNewTopic","postdiv");
    document.getElementById("topicTitleTextbox").value = submitTitle;
    document.getElementById("topicContentTextarea").value = submitContent;
}

function Search(){
    var str = myUrl+"?";
    var key = document.getElementById('searchTextbox').value;
    key.replace(/\W/g,' ');
    key.replace(/ +/g,'+');
    str += "groupId=" + document.getElementById('groupSelect').value;
    str += "&search=" + key;
    
    window.location.href = str;
    
}


function changeSortingOrder(method){
    selectMethod = method;
    if(inTopicPage == 1){
        loadTopicList();
    }else if (inTopicPage == 2){
        loadSearchList();
    }
}

function replyConfirm(){
    var str = "func=replyConfirm";
    str += "&topicId=" + currentTopicId;
    str += "&content=" + replyContent;
    exeStatement(str, ""); // need to change
    replyPageNumber = -1;
    loadPageSelector(currentTopicId,0);
    loadPage("func=loadNewReplyButton", "replydiv");
    loadReplyList(currentTopicId);
    scrollToPageBottom();
}

function replyReedit(){
    loadPage("func=loadNewReply","replydiv");
    document.getElementById("replyContentTextarea").value = replyContent;
}

function showDeleteLabel(id){
    document.getElementById(id).style.visibility = "visible";
}

function login(){
    var str = "func=login";
    str += "&username=" + document.getElementById('usernameTextbox').value;
    str += "&password=" + sha1(document.getElementById('passwordBox').value);
    str += "&keep=" + document.getElementById('keepLoginCheckbox').checked;
    loadPage(str, "topbar");
}

function hiddenDeleteLabel(id){
    document.getElementById(id).style.visibility = "hidden";
}

function loadPage(input_string, output_div){
    var xmlHttpReq = false;
    var self = this;
    if (window.XMLHttpRequest){ // code for IE7+, Firefox, Chrome, Opera, Safari
        self.xmlhttp = new XMLHttpRequest();
    }else{ // code for IE6, IE5
        self.xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    var xmlHttpReq = false;
    var self = this;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
        self.xmlHttpReq = new XMLHttpRequest();
    }
    else if (window.ActiveXObject) {// code for IE6, IE5
        self.xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");
    }
    self.xmlHttpReq.open('POST', loginCgiAddr, false);
    self.xmlHttpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    self.xmlHttpReq.onreadystatechange = function() {
        if (self.xmlHttpReq.readyState == 4) {
            document.getElementById(output_div).innerHTML = self.xmlHttpReq.responseText;
        }
    }
    self.xmlHttpReq.send(input_string);
}


function exeStatement(input_string){
    var xmlHttpReq = false;
    var self = this;
    if (window.XMLHttpRequest){ // code for IE7+, Firefox, Chrome, Opera, Safari
        self.xmlhttp = new XMLHttpRequest();
    }else{ // code for IE6, IE5
        self.xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    var xmlHttpReq = false;
    var self = this;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
        self.xmlHttpReq = new XMLHttpRequest();
    }
    else if (window.ActiveXObject) {// code for IE6, IE5
        self.xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");
    }
    self.xmlHttpReq.open('POST', loginCgiAddr, false);
    self.xmlHttpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    self.xmlHttpReq.onreadystatechange = function() {
        if (self.xmlHttpReq.readyState == 4) {
        }
    }
    self.xmlHttpReq.send(input_string);
}


function onPasswordEnter(code){
    if (code==13){
        login();
    }
}

function onSearchTextboxEnter(code){
    if (code==13){
        Search();
    }
}



function sha1(input){
    var NewScript=document.createElement('script')
    NewScript.src="sha1-min.js"
    document.body.appendChild(NewScript);
    return hex_sha1(input);
}


function scrollToPageBottom(){
    window.scrollTo(0, document.body.scrollHeight);
}

