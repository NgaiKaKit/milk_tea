

//perlのアドレス
loginCgiAddr = '/cgi-bin/loading.cgi';

//自分のアドレス
myUrl = 'http://hnomka.dlinkddns.com';



// 1 = topiclist, 2 = searchlist, 0 = replylist
inTopicPage = 1;

topicPageNumber = 1;

replyPageNumber = 1;

//現在属するグルップのid
currentGroupId = 0;


submitTitle = "";
submitContent ="";
replyContent = "";
currentTopicId = "";
currentSearchString = "";

setInterval(function() {myTimer()},180000);
selectMethod = "post";

//timer event, cookies update
function myTimer(){
    exeStatement("func=updateLoginStatus");
}


//link 諜報を処理
function initPage() {
    loadPage("func=loadStatusTable", "topbar");
    loadPage("func=loadSearchTable", "searchContent");
    var query = window.location.search.substring(1);
    var s = query.split("&");
    //一回だけログインcookiesを更新します
    myTimer();
    //トッピグページにいます
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
        //返信ページにいます
        if (pair1[0] == 'groupId' && pair2[0]=='topicId'){
            loadTopic(pair1[1], pair2[1]);
            return;
        }
        //検索ページにいます
        if (pair1[0] == 'groupId' && pair2[0]=='search'){
            loadSearch(pair1[1], pair2[1]);
            return;
        }
    }
    //メインページにいます
    loadMainPage();
};


//メインページを読み込め
function loadMainPage(){
    currentGroupId = 0;
    inTopicPage = 1;
    topicPageNumber = 1;
    loadPage("func=loadMainPage","mainContent");
    loadPage("func=loadGroupList", "groupListdiv");
}

//トピックページを読み込め
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


//返信ページを読み込め
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

//検索ページを読み込め
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


//メインページへ行く
function goMainPage(){
    window.location.href = myUrl;
}

function openGroup(groupId){
    window.location.href = myUrl+"?groupId=" +groupId;
}

//返信ページへ行く
function openTopic(groupId, topicId){
    exeStatement("func=setTopicPage&topicPage="+topicPageNumber);
    window.location.href = myUrl+"?groupId=" +groupId +"&topicId=" + topicId;
    
}


//検索の結果を読み込め
function loadSearchList(){
    var str = "func=loadSearchList";
    str += "&searchKey=" + currentSearchString;
    str += "&selector=" + selectMethod;
    str += "&currentGroup=" + currentGroupId;
    str += "&currentPage=" + topicPageNumber;
    loadPage(str, "topicListdiv");
    
}

//返信リストを読み込め
function loadReplyList(topicId){
    var str = "func=loadReplyList";
    str += "&currentPage=" + replyPageNumber;
    str += "&topicId=" + topicId;
    loadPage(str, "replyListdiv");
}

//トピックページへ戻る
function backToTopic(groupId){
    window.location.href = myUrl+"?groupId=" +groupId;
}


//パスワード変更ページを読み込め
function editInfo(){
    loadPage ("func=loadEditTable","mainContent");
}


//トピックリストを読み込め
function loadTopicList(){
    //var selector = document.getElementById("OrderSelect");
    
    var str = "func=loadTopicList";
    str += "&selector=" +selectMethod;
    str += "&currentPage=" + topicPageNumber;
    str += "&currentGroup=" + currentGroupId;
    loadPage(str, "topicListdiv");
}

//ログインしていないテーフルを表示
function loadLoginBar(){
    loadPage("func=loadLoginTable", "topbar");
}
//ログインしたの情報を表示
function loadStatusBar(){
    loadPage("func=loadStatusBar", "topbar");
}
//説明ページを読み込め
function loadWelcomePage(){
    loadPage("func=loadWelcomePage", "mainContent");
}
//登録ページを読み込め
function loadRegistBar(){
    loadPage("func=loadRegistBar", "mainContent");
}
//パスワード変更
function changePassword(){
    var form = document.forms["editForm"];
    //パスワードは半角ですかのチェック
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
        alert("パスワード入力していません");
        form.newPassword.value = "";
        form.newPassword2.value = "";
        
    }
    //パスワードの一致チェック
    else if(form.newPassword.value != form.newPassword2.value){
        alert("新しいパスワードが一致しません");
        form.newPassword.value = "";
        form.newPassword2.value = "";
    }
    //パスワードが短すぎる
    else if (form.newPassword.value.length < 6){
        if (form.newPassword.value.length == ""){
            alert("新しいパスワードを入力してください");
        }else{
            alert("新しいパスワードが短いすぎる");
        }
        form.newPassword.value = "";
        form.newPassword2.value = "";
        //パスワードが長すぎる
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


//登録
function registration(){
    var form = document.forms["regist_form"];
    //パスワードは半角ですかのチェック
    for ( var i = 0; i < form.password.value.length; i++){
        var length=escape(form.password.value.charAt(i)).length;
        if (length >= 4){
            alert("パスワードを半角文字使ってください");
            form.password.value = "";
            form.password2.value = "";
            return;
        }
    }
    //名前は半角ですかのチェック
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
    //メールアドレスは半角ですかのチェック
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
    //パスワードの一致のチェック
	if(form.password.value != form.password2.value){
        alert("パスワードが一致しません");
        form.password.value = "";
        form.password2.value = "";
    }
    //パスワードが短いすぎる
    else if (form.password.value.length < 6){
         //入力していません
        if (form.password.value.length == ""){
            alert("パスワードを入力してください");
        }else{
            alert("パスワードが短いすぎる");
        }
        form.password.value = "";
        form.password2.value = "";
    //パスワードが長過ぎる
    }else if (form.password.value.length > 32){
        alert("パスワードが長いすぎる");
        form.password.value = "";
        form.password2.value = "";
    }
    //名前がない
    else if (form.user_name.value == ""){
        alert("お名前を入力してください");
    }
    //名前が長過ぎ
    else if (form.user_name.value.length > 20){
        alert("お名前が長すぎる");
    //メーアドレスが長過ぎ
    }else if (form.mail_address.value.length > 100){
        alert("メールアドレスが長過ぎる");
    }
    //問題ありません
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

//トピックを削除
function deleteTopic(topicId){
    ans = confirm("このトッピグを削除します、よろしいですか");
    if (ans){
        exeStatement("func=deleteTopic&topicId=" + topicId);
        loadTopicList();
    }
}

//返信を削除
function deleteReply(replyId){
    ans = confirm("この返信を削除します、よろしいですか");
    if (ans){
        exeStatement("func=deleteReply&replyId=" + 　replyId);
        loadReplyList();
    }
}

//ログアウト
function logout(){
    loadPage("func=logout","");
    window.location.href = myUrl;
}
//発表ボタンを押す
function newTopic(){
    loadPage("func=loadNewTopic","postdiv");
}

//返信ボタンを押す
function newReply(){
    loadPage("func=loadNewReply","replydiv");
    scrollToPageBottom();
}




//トピックを提出、下見を作る、そして確認を待つ
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
    str += "&title=" + encodeForSending(submitTitle);
    str += "&content=" + encodeForSending(submitContent);
    loadPage(str, "postdiv");
}
//トピックの提出を放棄する

function replaceAt(s, index, char){
    return s.substr(0,index) + char + s.substr(index+char.length);
}

function cancelSubmitTopic(){
    var ans = 1;
    submitTitle = document.getElementById("topicTitleTextbox").value;
    submitContent = document.getElementById("topicContentTextarea").value;
    //確認
    if (submitTitle != "" || submitContent != ""){
        ans = confirm("入力した内容が削除されます、よろしいですか");
    }
    if (ans){
        loadPage("func=loadNewTopicButton", "postdiv");
        submitTitle = "";
        submitContent = "";
    }
}
//どのページへ移動する
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
//トプック確認、提出

function encodeForSending(str){
    result = "";
    for (var i = 0; i < str.length; i++){
        if (str[i] == '&'){
            result +="＆";
        }
        else{
            result += str[i];
        }
    }
    return result;
}

function postTopicConfirm(){
    
    var str = "func=postTopicConfirm";
    str += "&title=" + encodeForSending(submitTitle);
    str += "&content=" + encodeForSending(submitContent);
    str += "&groupId=" + currentGroupId;
    loadPage(str,"topbar"); // need to change
    topicPageNumber = 1;
    loadPageSelector(currentGroupId,1);
    loadPage("func=loadNewTopicButton", "postdiv");
    loadTopicList();
}
//トピックを再編集
function postReedit(){
    loadPage("func=loadNewTopic","postdiv");
    document.getElementById("topicTitleTextbox").value = submitTitle;
    document.getElementById("topicContentTextarea").value = submitContent;
}

//検索するlinkを作り
function Search(){
    var str = myUrl+"?";
    var key = document.getElementById('searchTextbox').value;
    //文字以外のを+へ変更
    key.replace(/\W/g,' ');
    key.replace(/ +/g,'+');
    str += "groupId=" + document.getElementById('groupSelect').value;
    str += "&search=" + key;
    
    window.location.href = str;
    
}

//並び順を変わるとき
function changeSortingOrder(method){
    selectMethod = method;
    
    if(inTopicPage == 1){
        loadTopicList();
    }else if (inTopicPage == 2){
        loadSearchList();
    }
}

//返信を提出、下見を作る、確認を待つ
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
    str += "&content=" + encodeForSending(replyContent);
    loadPage(str, "replydiv");
}


//返信をキャンセル
function cancelSubmitReply(){
    
    var ans = 1;
    replyContent = document.getElementById("replyContentTextarea").value;
    //確認
    if (replyContent != ""){
        ans = confirm("入力した内容が削除されます、よろしいですか");
    }
    if (ans){
        loadPage("func=loadNewReplyButton", "replydiv");
        replyContent = "";
    }
    
}

//返信を確認、提出
function replyConfirm(){
    var str = "func=replyConfirm";
    str += "&topicId=" + currentTopicId;
    str += "&content=" + encodeForSending(replyContent);
    exeStatement(str, ""); // need to change
    replyPageNumber = -1;
    loadPageSelector(currentTopicId,0);
    loadPage("func=loadNewReplyButton", "replydiv");
    loadReplyList(currentTopicId);
    scrollToPageBottom();
}


//返信を再び編集
function replyReedit(){
    loadPage("func=loadNewReply","replydiv");
    document.getElementById("replyContentTextarea").value = replyContent;
}

//ボタン出現
function showDeleteLabel(id){
    document.getElementById(id).style.visibility = "visible";
}

//ボタン消失
function hiddenDeleteLabel(id){
    document.getElementById(id).style.visibility = "hidden";
}

//ログイン処理
function login(){
    var str = "func=login";
    str += "&username=" + document.getElementById('usernameTextbox').value;
    str += "&password=" + sha1(document.getElementById('passwordBox').value);
    str += "&keep=" + document.getElementById('keepLoginCheckbox').checked;
    loadPage(str, "topbar");
}


//ページを読み込めajax function
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

//読み込みがないajax
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

//selector ajax
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

//textbox入力をゲットする、enterを押したらlogin()へ
function onPasswordEnter(code){
    if (code==13){
        login();
    }
}

//textbox入力をゲットする、enterを押したらsearch()へ
function onSearchTextboxEnter(code){
    if (code==13){
        Search();
    }
}


//sha1 hash function
function sha1(input){
    var NewScript=document.createElement('script')
    NewScript.src="sha1-min.js"
    document.body.appendChild(NewScript);
    return hex_sha1(input);
}

//ページscrollを最後へ移動する
function scrollToPageBottom(){
    window.scrollTo(0, document.body.scrollHeight);
}

