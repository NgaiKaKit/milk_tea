#!/usr/bin/perl -w
use CGI;

use strict;
use warnings;
use DateTime;
use SQL qw(get_group_by_id get_group get_total_topic get_total_search get_total_reply write_user edit_user get_user_info check_password post_topic get_topic get_topic_by_id delete_topic reply_topic get_reply delete_reply search_topic);
use utf8;

use DateTime::Format::MySQL;
use CGI::Cookie;

binmode (STDIN, ":utf8");
binmode (STDOUT, ":utf8");


my $query = new CGI;

my $func = $query->param('func');
my $remotehost = $query->remote_host();

my $fut_time=gmtime(time()+365*24*3600)." GMT";

my @cookies;



my @html = "";

#タイトル文字を処理する
#param: input_string
#return: processed_string
sub processTopic{
    $_[0] =~ s/</ ＜ /g;
    $_[0] =~ s/>/ ＞ /g;
    return $_[0];
}

#コメント文字を処理する
#param: input_string
#return: processed_string
sub processContent{
    
    #replace html characters
    $_[0] =~ s/</＜/g;
    $_[0] =~ s/>/＞/g;
    
    $_[0] =~ s/&/ &amp;/g;
    
    
    #replace blankline
    $_[0] =~ s/\n/\ <br\/\> /g;
    
    
    
    #replace email
    my $a ="<a href=\'mailto:";
    my $b ="\'>";
    my $c = "</a>";
    $_[0] =~ s/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/$a$&$b$&$c/gi;
    
    #replace youtube
    $a ="<iframe width='640' height='360' src='";
    $b ="' frameborder='0' allowfullscreen></iframe>";
    $_[0] =~ s/(http:\/\/)\w{0,3}.?youtube+\.\w{2,3}\/watch\?v=[\w-]{11}/$a$&$b/gi;
    $_[0] =~  s/youtube\.com\/watch\?v=/youtube\.com\/embed\//gi;
    
    #replace image
    $a ="<a href=\'";
    $b ="\' target='_blank'> <img src=\'";
    $c ="\' class='image'></a>";
    $_[0] =~ s/((http|https|ftp)\:\/\/)[a-zA-Z0-9\-\.\~]+\.[a-zA-Z]{2,3}(\/[a-zA-Z0-9\-\.\_\~]*)*\.(jpg|bmp|gif|png)/$a$&$b$&$c/gi;
    
    #replace link
    $a ="<a href=\'";
    $b ="\' target='_blank'>";
    $c = "</a>";
    $_[0] =~ s/(\s|^)((http|https|ftp)?\:\/\/)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(:[a-zA-Z0-9]*)?\/?([a-zA-Z0-9\-\._\?\,\'\/\\\+&amp;%\$#\=~])*[^\.\,\)\(\s]/$a$&$b$&$c/gi;
    
    #replace space
    $_[0] =~ s/ /&nbsp;/gi;
    return $_[0];
}

#html ファイルから文字を読み上げる
#param: file_path
sub load_html{
    open (INPUT,'<'.$_[0]);
    binmode(INPUT, ":utf8");
    my $string = join ("", <INPUT>);
    close INPUT;
    return $string;
}

#ページ選ぶ用の
sub loadPageSelector{
    my $totalPage = $_[0];
    my $currentPage = $_[1];
    
    my $firstPageButton = "";
    my $previewPageButton = "";
    my $pageButton = "";
    my $nextPageButton = "";
    my $lastPageButton = "";
    
    my $start = max(1,min ($totalPage - 8, $currentPage-4));
    #最初のページじゃない時
    if ($currentPage != 1){
        $firstPageButton = "<table class='selectorButton' onclick='goPage(1);'><tr><th>1</th></tr></table>";
        $previewPageButton = "<table class='selectorButton' onclick='goPage(". max($currentPage - 1, 1).");'><tr><th><<</th></tr></table>";
    }
    #最後のページじゃない時
    if ($currentPage < $totalPage){
        $nextPageButton = "<table class='selectorButton' onclick='goPage(".min($totalPage, $currentPage + 1).");'><tr><th>>></th></tr></table>";
        $lastPageButton = "<table class='selectorButton' onclick='goPage(".$totalPage.");'><tr><th>".$totalPage."</th></tr></table>";
    }
    $pageButton .= "<table width='100%' height ='40'><tr>";
    for (my $i = $start;$i <= min($start+8, $totalPage); $i++){
        #今にいるページ
        if ($i ~~ $currentPage){
            $pageButton .=  "<th><table class='currentPageButton'><tr><th>".$currentPage ."</th></tr></table></th>";
        }
        #ほかのページ
        else{
            $pageButton .= "<th><table class='selectorButton' onclick='goPage(". $i. ");'><tr><th>". $i . "</th></tr></table></th>";
        }
    }
    
    $pageButton .= "</tr></table>";
    push @html, sprintf load_html("html/pageSelector.html"), $firstPageButton, $previewPageButton, $pageButton, $nextPageButton, $lastPageButton;
}

#cookiesからユーザーの名前とパスワードを取る、検証します、cookiesがない時はguestになる
#param:
#return: user_id, username, password
sub confirmUser{
    my %getCookies = CGI::Cookie->fetch;
    my $username = "";
    my $password = "";
    if ((exists $getCookies{'username'}) and (exists $getCookies{'password'} )){
        $username = $getCookies{'username'}->value;
        $password = $getCookies{'password'}->value;
        return (check_password($username, $password), $username, $password);
    }else{
        return (2, "guest","guest");
    }
}

#時間の表示、秒を外します
#param: datetime_string
#return: processed_datetime
sub dateTimeFormat{
    my ($date, $time) = split (' ', $_[0]);
    my ($hour, $minute, $second) = split (':', $time);
    return $date.' '.$hour.':'.$minute;
}


#インプットした時刻と現在までの差
#param: datetime_string
#return: processed_datetime
sub dateTimeToNow{
    my $dt = DateTime->now(time_zone => 'Asia/Tokyo') - dateTimeConvert($_[0]);
    
    if ($dt->years != 0){
        return $dt->years ."年前";
    }
    if ($dt->months != 0){
        return $dt->months ."月前";
    }
    if ($dt->days != 0){
        return $dt->days ."日前";
    }
    if ($dt->hours != 0){
        return $dt->hours ."時間前";
    }
    if ($dt->minutes != 0){
        return $dt->minutes ."分前";
    }
    return $dt->seconds ."秒前";
    
}

#stringからdatetimeの変換
#param: datetime_string
#return: datetime
sub dateTimeConvert{
    my ($date, $time) = split (' ', $_[0]);
    my ($hour, $minute, $second) = split (':', $time);
    my ($year, $month, $day) = split ('-', $date);
    
    
    return DateTime->new(year => $year,
    month => $month,
    day => $day,
    hour => $hour,
    minute => $minute,
    second => $second,
    );
    
}


sub max{
    return ($_[0] < $_[1] ? $_[1] : $_[0]);
}


sub min{
    return ($_[0] > $_[1] ? $_[1] : $_[0]);
}


#funcを分類する
if($func ~~ 'loadStatusTable'){
    #最初のユーザーのログイン状況を分類します
    my %getCookies = CGI::Cookie->fetch;
    my $logined = 0;
    my $username = "";
    my $password = "";
    #ログイン情報が存在するとき
    if ((exists $getCookies{'logined'}) and (exists $getCookies{'username'}) and (exists $getCookies{'password'} )){
        $logined = $getCookies{'logined'}->value;
        $username = $getCookies{'username'}->value;
        $password = $getCookies{'password'}->value;
        if (check_password($username, $password)){
            push @html, sprintf load_html("html/userTable.html"), $username;
        }
        else{
            $logined = 0;
        }
    }
    #ログインしていないとき
    unless ($logined){
        push @html, sprintf load_html("html/loginTable.html"),"smallLabel","ログインしていません";
    }
}
elsif ($func ~~ 'loadSearchTable'){
    # 検索テーブルを読む
    my @t = get_group();
    
    my $optionList="";
    for (my $i = 0; $i <= $#t; $i ++){
        $optionList .= "<option value='".$t[$i][0]."'>".$t[$i][1]."</option>";
    }
    push @html, sprintf load_html("html/searchTable.html"), $optionList;
    
    
}
elsif ($func ~~ 'login'){
    #ログイン
    my $username = $query->param("username");
    my $password = $query->param("password");
    my $keep = $query->param("keep");
    #パスワード検証
    my $userId = check_password($username, $password);
    my $time =  $keep ? "+3M": "+5m";
    my $logined = $keep ? 2:1;
    #login success;
    if ($userId >= 0){
        push @html, sprintf load_html("html/userTable.html"), $username;
        push @cookies, $query->cookie(-name=>'logined', -value=>$logined, -expires=>$time, -path=>'/');
        push @cookies, $query->cookie(-name=>'username', -value=>$username, -expires=>$time, -path=>'/');
        push @cookies, $query->cookie(-name=>'password', -value=>$password, -expires=>$time, -path=>'/');
        
    }else{#失敗
        push @html, sprintf load_html("html/loginTable.html"),"warningSmallLabel","ログイン失敗";
    }
}elsif ($func ~~ 'logout'){
    #ログアウト、Cookies破棄
    push @cookies, $query->cookie(-name=>'logined', -value=>'1', -expires=>"-1y", -path=>'/');
    push @cookies, $query->cookie(-name=>'username', -value=>'0', -expires=>"-1y", -path=>'/');
    push @cookies, $query->cookie(-name=>'password', -value=>'0', -expires=>"-1y", -path=>'/');
}
elsif ($func ~~ 'loadRegistBar'){
    #登録ページを読む
    push @html, sprintf load_html("html/registTable.html"), "","","","","","","","","";
}
elsif ($func ~~ 'loadEditTable'){
    #パスワード変更ページを読む
    push @html, sprintf load_html("html/editTable.html"), "", "","","";
}
elsif ($func ~~ 'registration'){
    #登録処理
    my $username = $query->param('username');
    my $email = $query->param('email');
    my $password = $query->param('password');
    my $password2 = $query->param('password2');
    my $warning1="";
    my $warning2="";
    my $warning3="";
    #登録処理
    my $result = write_user($username, $password,$email, '0',   DateTime->now(time_zone => 'Asia/Tokyo') );
    
    #登録成功
    if ($result == 0){
        push @html, load_html("html/welcome.html");
        push @cookies, $query->cookie(-name=>'logined', -value=>'1', -expires=>"+5m", -path=>'/');
        push @cookies, $query->cookie(-name=>'username', -value=>$username, -expires=>"+5m", -path=>'/');
        push @cookies, $query->cookie(-name=>'password', -value=>$password, -expires=>"+5m", -path=>'/');
    }
    #失敗、ユーザー名は存在している
    elsif ($result == 1){
        $warning2 = "ユーザー名が使われています";
        $username ="";
    }
    #失敗、メールアドレスは存在している
    elsif ($result == 2){
        $warning3 = "メールアドレスが使われています";
        $email = "";
    }
    
    #失敗、登録ページとメッセージの表示
    if ($result != 0){
        push @html, sprintf load_html("html/registTable.html"), $email, $warning1,$username, $warning2, "", $warning3,"";
    }
    
}
elsif ($func ~~ 'changePassword'){
    #パスワード変更
    my $username = "";
    my %getCookies = CGI::Cookie->fetch;
    if (exists $getCookies{'username'}){
        $username = $getCookies{'username'}->value;
        
        my $oldPassword = $query->param('oldPassword');
        my $newPassword = $query->param('newPassword');
        my $newPassword2 = $query->param('newPassword2');
        #パスワードを検証
        my $userId = check_password($username, $oldPassword);
        #正しい
        if ($userId > 0){
            edit_user($userId, $newPassword);
            push @html, "変更完了";
            push @cookies, $query->cookie(-name=>'password', -value=>$newPassword, -expires=>"+5m", -path=>'/');
            
        }else{
            #間違え
            push @html, sprintf load_html("html/editTable.html"), "", "現在のパスワードが間違っている","","";
        }
    }
    
}
elsif ($func ~~ 'loadMainPage'){
    #メインページを読み込め
    push @html, sprintf load_html("html/mainPage.html");
}elsif ($func ~~ 'loadGroupList'){
    #グルップのリストを読み込め
    my @t = get_group();
    
    my $str = load_html("html/groupTable.html");
    for (my $i = 0; $i <= $#t; $i ++){
        #トッピグがありませんの時
        if ($t[$i][3] ~~ 'null'){
            push @html, sprintf $str, $t[$i][0], $t[$i][0], $t[$i][0], $t[$i][1], $t[$i][2], "トッピグがありません", "";
        }
        #トッピグがのあるの時
        else{
            push @html, sprintf $str, $t[$i][0], $t[$i][0], $t[$i][0], $t[$i][1], $t[$i][2], $t[$i][3], dateTimeToNow($t[$i][4])." by ".$t[$i][5];
        }
    }
}
elsif ($func ~~'loadWelcomePage'){
    #説明ページを読み込め
    push @html, load_html("html/welcome.html");
}
elsif ($func ~~ 'loadMainTopicPage'){
    #トピック一覧ページを読み込め
    push @html, sprintf load_html("html/mainTopicPage.html"), get_group_by_id($query->param("groupId"));
}
elsif ($func ~~ 'loadPageSelector'){
    #ページ選ぶのbuttonsよ読み込め
    my $type = $query->param('type');
    #現在はトピック一覧のページ
    if ($type ~~ 1){
        
        my $groupId = $query->param('Id');
        #トピック数を計算する
        my $totalTopic = get_total_topic($groupId);
        my $totalPage = int(( $totalTopic - 1)/10) + 1;
        my $currentPage = $query->param('currentPage');
        my %getCookies = CGI::Cookie->fetch;
        #cookiesがtopicPage存在時は、これは前のpagenumber、そのページへ戻る (返信からトピックページへ戻るの時に使え
        if (exists $getCookies{'topicPage'} ){
            $currentPage = $getCookies{'topicPage'}->value;
        }
        
        loadPageSelector($totalPage, $currentPage);
    }
    #現在は検索のページ
    elsif($type ~~ 2){
        my $groupId = $query->param('Id');
        my $searchKey = $query->param('searchKey');
        #トピック数を計算する
        my $totalTopic = get_total_search($groupId, $searchKey);
        my $totalPage = int(( $totalTopic - 1)/10) + 1;
        my $currentPage = $query->param('currentPage');
        my %getCookies = CGI::Cookie->fetch;
        #cookiesがtopicPage存在時は、これは前のpagenumber、そのページへ戻る (返信から検索ページへ戻るの時に使え
        if (exists $getCookies{'topicPage'} ){
            $currentPage = $getCookies{'topicPage'}->value;
            #push @cookies, $query->cookie(-name=>'topicPage', -value=>'1', -expires=>"-1y", -path=>'/');
        }
        loadPageSelector($totalPage, $currentPage);
    }
    #現在は返信のページ
    else
    {
        my $topicId = $query->param('Id');
        #返信数を計算する
        my $totalReply= get_total_reply($topicId);
        my $totalPage = int(( $totalReply - 1)/10) + 1;
        my $currentPage = $query->param('currentPage');
        $currentPage = $totalPage if ($currentPage==-1);
        loadPageSelector($totalPage, $currentPage);
        
    }
}
elsif($func ~~ 'loadNewTopicButton'){
    #新トピックのボタンを読み込め
    push @html, sprintf load_html("html/newTopicButton.html");
}
elsif ($func ~~ 'loadNewTopic'){
    #新トピックの書き込めフォームを読み込め
    push @html, sprintf load_html("html/topicForm.html"),"";
}
elsif ($func ~~'loadSearchList'){
    #検索リストを読み込め
    my $searchKey = $query->param("searchKey");
    my $selector = $query->param("selector");
    my $currentPage = $query->param("currentPage");
    my %getCookies = CGI::Cookie->fetch;
    
    #cookiesがtopicPage存在時は、これは前のpagenumber、そのページへ戻る (返信から検索ページへ戻るの時に使え
    if (exists $getCookies{'topicPage'} ){
        $currentPage = $getCookies{'topicPage'}->value;
        #もう使ったので破棄します
        push @cookies, $query->cookie(-name=>'topicPage', -value=>'1', -expires=>"-1y", -path=>'/');
    }
    
    my $currentGroup = $query->param("currentGroup");
    #トピックを読み込め
    my @t = search_topic($currentPage,10, $selector, $currentGroup,$searchKey);
    my $str = load_html("html/topicTable.html");
    #ユーザー検証
    my ($userId, $username, $password) = confirmUser();
    
    for (my $i = 0; $i <= $#t; $i ++){
        my $duration = DateTime->now(time_zone => 'Asia/Tokyo') - dateTimeConvert($t[$i][4]);
        my @list = $duration->in_units('years','months', 'days', 'hours', 'minutes', 'seconds' );
        my $n = " ";
        #NEW タブを表示
        if ($list[0] == 0 && $list[1] == 0 && $list[2] == 0){
            $n = "<span class='newLabel'><b>NEW</b></span>"; #new label
        }
        
        my $onMouseOver ="";
        my $onMouseOut = "";
        my $button = "";
        # 削除できるとき、つまり、(admin or自分)　and guestじゃないとき
        if(($userId == 1 or $userId == $t[$i][8]) and $userId != 2){
            $onMouseOver = "showDeleteLabel('DL".$t[$i][1]."')";
            $onMouseOut = "hiddenDeleteLabel('DL".$t[$i][1]."')";
            $button = "<span class='deleteLabel' id = 'DL".$t[$i][1]."' onclick='deleteTopic(".$t[$i][1].")'><b>✖</b></span>";
        }
        #返信がないとき
        if ($t[$i][6] ~~ 'null'){
            push @html, sprintf $str,$onMouseOver, $onMouseOut, $t[$i][1], $t[$i][1],$currentGroup, $t[$i][1], $n.$t[$i][2],$t[$i][0],dateTimeFormat($t[$i][4]),$t[$i][5],"返信がありません","",$button;
            
        }
        #返信があるとき
        else{
            push @html, sprintf $str,$onMouseOver, $onMouseOut, $t[$i][1], $t[$i][1],$currentGroup, $t[$i][1],$n.$t[$i][2],$t[$i][0],dateTimeFormat($t[$i][4]),$t[$i][5],$t[$i][6],dateTimeToNow($t[$i][7]),$button;
        }
    }
    
    
}

elsif ($func ~~'loadTopicList'){
    
    #トピックリストを読み込め
    my $selector = $query->param("selector");
    my $currentPage = $query->param("currentPage");
    
    my %getCookies = CGI::Cookie->fetch;
    #cookiesがtopicPage存在時は、これは前のpagenumber、そのページへ戻る (返信からトピックページへ戻るの時に使え
    if (exists $getCookies{'topicPage'} ){
        $currentPage = $getCookies{'topicPage'}->value;
        #もう使ったので破棄します
        push @cookies, $query->cookie(-name=>'topicPage', -value=>'1', -expires=>"-1y", -path=>'/');
    }
    
    my $currentGroup = $query->param("currentGroup");
    #トピックを読み込め
    my @t = get_topic($currentPage,10, $selector, $currentGroup);
    my $str = load_html("html/topicTable.html");
    
    #ユーザー検証
    my ($userId, $username, $password) = confirmUser();
    
    
    
    for (my $i = 0; $i <= $#t; $i ++){
        my $duration = DateTime->now(time_zone => 'Asia/Tokyo') - dateTimeConvert($t[$i][4]);
        my @list = $duration->in_units('years','months', 'days', 'hours', 'minutes', 'seconds' );
        my $n = " ";
        #NEW タブを表示
        if ($list[0] == 0 && $list[1] == 0 && $list[2] == 0){
            $n = "<span class='newLabel'><b>NEW</b></span>"; #new label
        }
        
        my $onMouseOver ="";
        my $onMouseOut = "";
        my $button = "";
        
        # 削除できるとき、つまり、(admin or自分)　and guestじゃないとき
        if(($userId == 1 or $userId == $t[$i][8]) and $userId != 2){
            $onMouseOver = "showDeleteLabel('DL".$t[$i][1]."')";
            $onMouseOut = "hiddenDeleteLabel('DL".$t[$i][1]."')";
            $button = "<span class='deleteLabel' id = 'DL".$t[$i][1]."' onclick='deleteTopic(".$t[$i][1].")'><b>✖</b></span>";
        }
        
        #返信がないとき
        if ($t[$i][6] ~~ 'null'){
            push @html, sprintf $str,$onMouseOver, $onMouseOut, $t[$i][1], $t[$i][1],$currentGroup, $t[$i][1], $n.$t[$i][2],$t[$i][0],dateTimeFormat($t[$i][4]),$t[$i][5],"返信がありません","",$button;
            
        }
        #返信があるとき
        else{
            push @html, sprintf $str,$onMouseOver, $onMouseOut, $t[$i][1], $t[$i][1],$currentGroup, $t[$i][1],$n.$t[$i][2],$t[$i][0],dateTimeFormat($t[$i][4]),$t[$i][5],$t[$i][6],dateTimeToNow($t[$i][7]),$button;
        }
    }
    
}

elsif ($func ~~ "loadReplyPage"){
    #返信ページを読み込め
    my $groupId = $query->param("groupId");
    my @data = get_topic_by_id($query->param("topicId"));
    push @html, sprintf load_html("html/mainReplyPage.html"), $groupId, get_group_by_id($groupId), $data[2],$query->param("topicId"), $data[3], $data[0], dateTimeFormat($data[4]);
}
elsif ($func ~~ "setTopicPage"){
    #現在のページ数を記録する(このページから離れるときが使え
    my $topicPage = $query->param("topicPage");
    push @cookies, $query->cookie(-name=>'topicPage', -value=>$topicPage, -expires=>"5m", -path=>'/');
}
elsif ($func ~~ "loadNewReplyButton"){
    #返信ボタンを読み込め
    push @html, sprintf load_html("html/newReplyButton.html");
}
elsif ($func ~~ "submitTopic"){
    #トピック発表の確認ページを読み込め
    my $content = $query->param("content");
    my $title = $query->param("title");
    push @html, sprintf load_html("html/topicConfirmTable.html"), processTopic($title), processContent($content);
}
elsif ($func ~~ "postTopicConfirm"){
    #トピック発表の確認、そして発表
    my $title = $query->param("title");
    my $content = $query->param("content");
    #ユーザー検証
    my ($userId, $username, $password) = confirmUser();
    
    my $groupId = $query->param("groupId");
    #ユーザー情報が正しいとき
    if( $userId>= 0){
        post_topic($userId,processTopic($title),DateTime->now(time_zone => 'Asia/Tokyo'),processContent($content),$groupId);
    }else{
        push @html,  "fail";
    }
}elsif ($func ~~ "loadNewReply"){
    #返信フォームを読み込め
    push @html, sprintf load_html("html/replyForm.html");
}
elsif ($func ~~ "submitReply"){
    #返信の確認ページを読み込め
    
    my $content = $query->param("content");
    push @html, sprintf load_html("html/replyConfirmTable.html"), processContent($content);
    
}elsif ($func ~~"replyConfirm"){
    #返信を確認した、返信
    my $topicId = $query->param("topicId");
    my $content = $query->param("content");
    #ユーザー検証
    my ($userId, $username, $password) = confirmUser();
    
    if($userId >= 0){
        reply_topic($topicId, $userId, DateTime->now(time_zone => 'Asia/Tokyo'),processContent($content));
    }else{
        push @html,  "fail";
    }
    
}elsif ($func ~~ "loadReplyList"){
    #返信リストを読み込め
    my $topicId = $query->param("topicId");
    #返信を読み
    my $totalReply= get_total_reply($topicId);
    my $totalPage = int(( $totalReply - 1)/10) + 1;
    my $currentPage = $query->param('currentPage');
    $currentPage = $totalPage if ($currentPage==-1);
    my @t = get_reply($currentPage,10, $topicId);
    
    my $str = load_html("html/replyTable.html");
    my ($userId, $username, $password) = confirmUser();
    for (my $i = 0; $i <= $#t; $i ++){
        #push @html, $t[$i][3];
        my $onMouseOver ="";
        my $onMouseOut = "";
        my $button = "";
        #返信を削除できるとき
        if(($userId ~~ 1 or $userId ~~ $t[$i][4]) and $userId != 2 ){
            $onMouseOver = "showDeleteLabel('DR".$t[$i][1]."')";
            $onMouseOut = "hiddenDeleteLabel('DR".$t[$i][1]."')";
            $button = "<span class='deleteReplyLabel' id = 'DR".$t[$i][1]."' onclick='deleteReply(".$t[$i][1].")'><b>✖</b></span>";
        }
        push @html, sprintf $str,$onMouseOver, $onMouseOut, $t[$i][1], $t[$i][1], $button, $t[$i][1], $t[$i][3], $t[$i][0],dateTimeFormat($t[$i][2]);
    }
    
    
}elsif ($func ~~ "updateLoginStatus"){
    #クライアントからのontime event、定期的にログインcookieの時間を更新
    my %getCookies = CGI::Cookie->fetch;
    my $username = "";
    my $password = "";
    my $logined = "";
    if ((exists $getCookies{'logined'}) and (exists $getCookies{'username'}) and (exists $getCookies{'password'} )){
        $username = $getCookies{'username'}->value;
        $password = $getCookies{'password'}->value;
        $logined = $getCookies{'logined'}->value;
        
        my $time =  $logined == 2 ? "+3M": "+5m";
        push @cookies, $query->cookie(-name=>'logined', -value=>$logined, -expires=>$time, -path=>'/');
        push @cookies, $query->cookie(-name=>'username', -value=>$username, -expires=>$time, -path=>'/');
        push @cookies, $query->cookie(-name=>'password', -value=>$password, -expires=>$time, -path=>'/');
    }
    
}
elsif ($func ~~ 'deleteTopic'){
    #トピック削除
    my ($userId, $username, $password) = confirmUser();
    if($userId >= 0){
        delete_topic($query->param('topicId'));
    }
}
elsif ($func ~~ 'deleteReply'){
    #返信削除
    my ($userId, $username, $password) = confirmUser();
    
    if($userId >= 0){
        delete_reply($query->param('replyId'));
    }
}
else{
    #funcが存在しないとき
    push @html, sprintf "Wrong Function Name\n";
}

#html output
print $query->header(-charset=>'utf-8', -cookie=>[ @cookies]);
print join "", @html;


#my $t = "a\na\na";
#print processContent($t);
