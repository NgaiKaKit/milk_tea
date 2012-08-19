#!/usr/bin/perl

package SQL;
use Exporter;
use strict;
use warnings;
use DateTime;
use DBI;
use CGI;
use Encode;
use utf8;
use Digest::SHA1 qw(sha1 sha1_hex sha1_base64);

my $dsn = 'DBI:mysql:kayac_assignment2';
my $user = 'root';
my $password = '_admin123';

binmode (STDIN, ":utf8");
binmode(STDOUT, ":utf8");
our @ISA = qw(Exporter);

our @EXPORT_OK = qw(get_group_by_id get_group get_total_topic get_total_search get_total_reply write_user edit_user get_user_info check_password post_topic get_topic get_topic_by_id delete_topic reply_topic get_reply delete_reply search_topic);

#検索の結果の数を表示
#param: group_id, search_key
#return: topic_number;
sub get_total_search{
	my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    my $group;
    if($_[0] == 0){
        $group = " AND topic.topic_id <> 0";
    }
    else{
        $group = " AND topic.group_id=".$_[0];
    }
    
    my @key = split (/\+/, $_[1]);
    my @searchString;
    my $maxKey = 4;
    $maxKey = $#key if ($#key < 4);
    for (my $i = 0; $i <= $maxKey; $i++){
        push @searchString, "topic.topic_title LIKE '%".$key[$i]."%' OR topic.content LIKE '%".$key[$i]."%' OR reply.content LIKE '%".$key[$i]."%'";
    }
        
    my $sth = $dbh->prepare("SELECT COUNT(*) FROM topic LEFT JOIN reply ON topic.topic_id = reply.topic_id WHERE (". (join " OR ", @searchString)." ) ".$group );
    
    $sth -> execute();
    my @result = $sth->fetchrow;
    return $result[0];
}

#トピックの数を表示
#param: group_id
#return: topic_number;
sub get_total_topic{
	my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    my $group;
    if($_[0] == 0){
        $group = " WHERE topic_id <> 0";
    }
    else{
        $group = " WHERE group_id=".$_[0];
    }
    my $sth = $dbh->prepare("SELECT COUNT(*) FROM topic".$group);
    
    $sth -> execute();
    my @result = $sth->fetchrow;
    return $result[0];
}

#返信の数を表示
#param: topic_id
#return: reply_number;
sub get_total_reply{
	my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $sth = $dbh->prepare("SELECT reply_count FROM topic WHERE topic_id = ?");
    $sth->bind_param ( 1, $_[0]);
    $sth -> execute();
    my @result = $sth->fetchrow;
    return $result[0];
}


#sub add_topic{
#    my $dbh = DBI ->connect ($dsn, $user, $password);
#    $dbh->do("set names utf8");
#
#    my $sth = $dbh->prepare("INSERT INTO `group`(group_name, total_topic, last_topic_id)  VALUES( 'ゲーム', 0,0)");
#    $sth -> execute();
#}
#print sha1_hex(sha1_hex("neko"),"2012-08-17 19:41:33")."\n";


#print sha1_hex("","2012-08-17 19:48:34");

#write_user("abcde", "", "","", '0',   DateTime->now(time_zone => 'Asia/Tokyo') );
#print sha1_hex(sha1_hex("hnomka"),"2012-08-17 19:21:48");


#ユーザーデータをデータベースに入れる
#param: username, password, email, type, reg_datetime
#return: 0 = success; 1 = user_name_exist; 2 = email_exists; 3 = unknown_error;
sub write_user{
	my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $sth = $dbh->prepare("INSERT INTO user_info(user_name, password, email, type, reg_datetime) VALUES( ?, ?, ?, ?, ?)");
	my $result = 0;
    #print $_[5];
    $sth->bind_param ( 1, $_[0]);
    $sth->bind_param ( 2, sha1_hex($_[1], $_[5]));
    $sth->bind_param ( 3, $_[2]);
    $sth->bind_param ( 4, $_[3]);
    $sth->bind_param ( 5, $_[4]);
    
    my $applyed = $sth -> execute();
    if ($applyed){
        #登録時間を読み出し
        $sth = $dbh->prepare("SELECT reg_datetime FROM user_info WHERE user_name = ?");
        $sth->bind_param ( 1, $_[0]);
        
        $sth -> execute();
        my $d = $sth->fetchrow;
        
        #shaしたパスワードデータを入れる
        $sth = $dbh->prepare("UPDATE user_info SET password = ? WHERE user_name = ?");
        $sth->bind_param ( 1, sha1_hex($_[1],$d));
        $sth->bind_param ( 2, $_[0]);
        $sth -> execute();
    }else
    {
    	$sth = $dbh->prepare("SELECT * FROM user_info WHERE user_name = ?");
    	$sth->bind_param(1,$_[0]);
    	$sth-> execute();
    	#名前が存在するとき
    	if ($sth->fetchrow){
    		$result = 1;
    	}
    	else {
            $sth = $dbh->prepare("SELECT * FROM user_info WHERE email = ?");
            $sth->bind_param(1,$_[3]);
            $sth-> execute();
            #メールアドレスが存在するとき
            if ($sth->fetchrow){
                $result = 2;
            }
            #不明
            else{
                $result = 3;
                
            }
    	}
    }
	$sth -> finish;
    
	$dbh ->disconnect;
	return $result;
}

#print sha1_hex(sha1_hex("_admin123"),"2012-08-08 00:00:00")."\n";
#print edit_user("GI", "SADAS", 'hnomka2@gmail.com', "25");

#パスワードの変更
#param: user_name, password, email, user_id
#return: 0 = success; 1 = user_name_exist; 2 = email_exists; 3 = unknown_error;
sub edit_user{
    my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");

    #登録時間を読み出し
    my $sth = $dbh->prepare("SELECT reg_datetime FROM user_info WHERE user_id = ?");
    $sth->bind_param ( 1, $_[0]);
    
    $sth -> execute();
    my $d = $sth->fetchrow;
    
    
    #shaしたパスワードデータを入れる
    $sth = $dbh->prepare("UPDATE user_info SET  password = ? WHERE user_id = ?");
	my $result = 0;
    $sth->bind_param ( 1, sha1_hex($_[1],$d));
    $sth->bind_param ( 2, $_[0]);
    
    $sth -> execute();
	$sth -> finish;
    
	$dbh ->disconnect;
}


#print join " ", get_user_info("25");

#ユーザー情報を読み出す
#param: user_id;
#return: @ { user_id, user_name, password, email, type, regist_day
sub get_user_info{
	my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $sth = $dbh->prepare("SELECT * FROM user_info WHERE user_id = ?");
    $sth->bind_param ( 1, $_[0]);
    
    $sth -> execute();
    my @result = $sth->fetchrow;
    return @result;
}


#print check_password('gauest',"sfd")."\n";

#パスワードを検証
#param: user_input, password
#return: positive = login success, -1 = password_wrong, -2 = user_input_wrong
sub check_password{
    
	my $result = 0;
	my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $sth = $dbh->prepare("SELECT password, user_id ,reg_datetime FROM user_info WHERE user_name = ? OR email = ?");
    $sth->bind_param ( 1, $_[0]);
    $sth->bind_param ( 2, $_[0]);
    
    $sth -> execute();
    if (my @t = $sth->fetchrow){
        #検証します
		$result = ($t[0] ~~ sha1_hex($_[1], $t[2]) ? $t[1]: -1);
	}
	else{
        #名前が存在しません
		$result = -2;
	}
	$sth -> finish;
	$dbh ->disconnect;
	
	return $result;
}



#post_topic("95","ガンダム",   DateTime->now(time_zone => 'Asia/Tokyo'), "だから、俺がガンダムだ!!!!" ,'11');
#post_topic("95","a",   DateTime->now(time_zone => 'Asia/Tokyo'), "だから、俺がガンダムだ!!!!" ,'12');

#トピックを書き込め
#param: user_id, topic_title, post_time, content, group_id
#return: 0 = post success, 1 = post fail
sub post_topic{
	my $result = 0;
	my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $sth = $dbh->prepare("INSERT INTO topic(user_id, topic_title, post_time, content, group_id) VALUES( ?, ?, ?, ?, ?);");
    $sth->bind_param ( 1, $_[0]);
    $sth->bind_param ( 2, $_[1]);
    $sth->bind_param ( 3, $_[2]);
    $sth->bind_param ( 4, $_[3]);
    $sth->bind_param ( 5, $_[4]);
    
    my $applied = $sth -> execute();
    $result = $applied ? 0 : 1;
    
    
    $sth -> finish;
	$dbh ->disconnect;
    
    update_group_info($_[4]);
	return $result;
}

#トピックを書き込めしたとき、groupの情報も更新する
#param: group_id
sub update_group_info{
	my $result = 0;
	my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
	#自グルップのデータを読み出す
    my $sth = $dbh->prepare("SELECT MAX(topic_id) FROM topic WHERE group_id = ?" );
    
    $sth->bind_param ( 1, $_[0]);
    $sth -> execute();
    my $topicId = $sth->fetchrow;
    $sth = $dbh->prepare("UPDATE `group` SET total_topic = ?, last_topic_id = ? WHERE group_id = ?");
    #total_topic, last_topic_idを更新
    $sth->bind_param ( 1, get_total_topic($_[0]));
    $sth->bind_param ( 2, $topicId);
    $sth->bind_param ( 3, $_[0]);
    $sth -> execute();
    
	#全部のグルップを読み出す
    $sth = $dbh->prepare("SELECT MAX(topic_id) FROM topic" );
    $sth -> execute();
    $topicId = $sth->fetchrow;
    
    #total_topic, last_topic_idを更新
    $sth = $dbh->prepare("UPDATE `group` SET total_topic = ?, last_topic_id = ? WHERE group_id = 0");
    
    $sth->bind_param ( 1, get_total_topic(0));
    $sth->bind_param ( 2, $topicId);
    $sth -> execute();
    
    $sth -> finish;
	$dbh ->disconnect;
    
}


#my @t = search_topic(1, 10, "post",0,"aa+you");

#for (my $i = 0; $i <= $#t; $i ++){
#  for (my $j = 0; $j <= 8; $j ++){
#        print $t[$i][$j] , " ";
#        }
#    print "\n";
#}

#検索
#print search_topic(1,10,"post",0, "テスト");
#param: page_number, post_per_page, sort, group_id, searchKey;
#result: array { user_name, topic_id, topic_title, content, post_time, reply_count, replier_name, last_reply_time}
sub search_topic{
    #print $_[4];
    my @result;
    my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $group;
    #グルップ分類
    if($_[3] ~~ 0){
        #全部の時
        $group = "";
    }
    else{
        $group = "AND topic.group_id=".$_[3];
    }
    #並び順を決定する
    my $orderMethod = "";
    if ($_[2] ~~ "post"){
        $orderMethod = "topic.post_time";
    }elsif ($_[2] ~~ "reply"){
        $orderMethod = "topic.last_reply_time";
    }elsif ($_[2] ~~ "reply_count"){
        $orderMethod = "topic.reply_count";
    }else{
        $orderMethod ="topic.post_time";
    }
    my @key = split (/\+/, $_[4]);
    #検索SQLを作る
    my @searchString;
    my $maxKey = 4;
    $maxKey = $#key if ($#key < 4);
    for (my $i = 0; $i <= $maxKey; $i++){
        my $ekey = Encode::decode('utf8', $key[$i]);
        push @searchString, "topic.topic_title LIKE '%".$ekey."%' OR topic.content LIKE '%".$ekey."%' OR reply.content LIKE '%".$ekey."%'";
    }
    
    my $substr = " ( SELECT topic.topic_id FROM topic LEFT JOIN reply ON topic.topic_id = reply.topic_id WHERE ". (join " OR ", @searchString)." ) ";
    #print $substr;
    
    my $sth = $dbh->prepare("SELECT poster.user_name, topic.topic_id, topic.topic_title, topic.content, topic.post_time , topic.reply_count, replier.user_name, topic.last_reply_time, topic.user_id FROM user_info AS poster, user_info AS replier, topic WHERE poster.user_id = topic.user_id AND topic.last_reply_people = replier.user_id AND topic.topic_id IN ".$substr." ".$group." ORDER BY ".$orderMethod." DESC LIMIT ? OFFSET ?;");
    $sth->bind_param ( 1,  $_[1]);
    $sth->bind_param ( 2, ($_[0] - 1) * $_[1]);
    $sth -> execute();
    
    while (my @data = $sth->fetchrow){
        push @result, [$data[0], $data[1], $data[2], $data[3], $data[4], $data[5],$data[6], $data[7], $data[8]];
    }
    
    return @result;
}



#my @t = get_topic(2,2, "post",0);

#for (my $i = 0; $i <= $#t; $i ++){
#  for (my $j = 0; $j <= 8; $j ++){
#        print $t[$i][$j] , " ";
#        }
#    print "\n";
#}
#トピックリストを読み出す
#param: page_number, post_per_page, sort, group_id;
#result: array { user_name, topic_id, topic_title, content, post_time, reply_count, replier_name, last_reply_time}
sub get_topic{
    my @result;
    my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $group;
    #グルップ分類
    if($_[3] ~~ 0){
        $group = "";
    }
    else{
        $group = "AND topic.group_id=".$_[3];
    }
    
    #並び順を決定する
    my $orderMethod = "";
    if ($_[2] ~~ "post"){
        $orderMethod = "topic.post_time";
    }elsif ($_[2] ~~ "reply"){
        $orderMethod = "topic.last_reply_time";
    }elsif ($_[2] ~~ "reply_count"){
        $orderMethod = "topic.reply_count";
    }else{
        $orderMethod ="topic.post_time";
    }
    
    my $sth = $dbh->prepare("SELECT poster.user_name, topic.topic_id, topic.topic_title, topic.content, topic.post_time , topic.reply_count, replier.user_name, topic.last_reply_time, topic.user_id FROM user_info AS poster, user_info AS replier, topic WHERE poster.user_id = topic.user_id AND topic.last_reply_people = replier.user_id AND topic.topic_id <> 0 ".$group." ORDER BY ".$orderMethod." DESC LIMIT ? OFFSET ?;");
    $sth->bind_param ( 1,  $_[1]);
    $sth->bind_param ( 2, ($_[0] - 1) * $_[1]);
    $sth -> execute();
    
    while (my @data = $sth->fetchrow){
        push @result, [$data[0], $data[1], $data[2], $data[3], $data[4], $data[5],$data[6], $data[7], $data[8]];
    }
    
    return @result;
}


#my @t = get_group();

#for (my $i = 0; $i <= $#t; $i ++){
#for (my $j = 0; $j <= 5; $j ++){
#        print $t[$i][$j] , " ";
#         }
#   print "\n";
#   }
#グルップリスとを読み出す
#result: group_id, group_name, total_topic, topic_title, post_time, user_name
sub get_group{
    my @result;
    my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $sth = $dbh->prepare("SELECT `group`.group_id, `group`.group_name, `group`.total_topic, topic.topic_title, topic.post_time, user_info.user_name FROM `group`, topic, user_info WHERE `group`.last_topic_id = topic.topic_id AND topic.user_id = user_info.user_id ORDER BY `group`.group_id");
    $sth -> execute();
    
    while (my @data = $sth->fetchrow){
        push @result, [$data[0], $data[1], $data[2], $data[3], $data[4], $data[5]];
    }
    
    return @result;
}

#グルップの名前を読み出す
#param: group_id
#return: group_name
sub get_group_by_id{
    my $result;
    my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $sth = $dbh->prepare("SELECT group_name FROM `group` WHERE group_id = ?");
    $sth->bind_param ( 1,  $_[0]);
    $sth -> execute();
    
    $result = $sth->fetchrow;
    
    return $result;
}

#トプック一つの情報を読み出す
#param: topic_id;
#result:  user_name, topic_id, topic_title, content, post_time, group_name
sub get_topic_by_id{
    my @result;
    my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $sth = $dbh->prepare("SELECT user_info.user_name, topic.topic_id, topic.topic_title, topic.content, topic.post_time, `group`.group_name FROM user_info, topic, `group` WHERE user_info.user_id = topic.user_id AND topic.topic_id = ? AND `group`.group_id = topic.group_id");
    $sth->bind_param ( 1,  $_[0]);
    $sth -> execute();
    
    @result = $sth->fetchrow;
    
    return @result;
}

#print delete_topic(2);

#func: delete_topic
#param: topic_id
#return: 0 = delete success, 1 = delete fail
sub delete_topic{
	my $result = 0;
	my $dbh = DBI -> connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    my $sth = $dbh->prepare("SELECT group_id FROM topic WHERE topic_id = ?");
    $sth->bind_param ( 1, $_[0]);
    $sth->execute();
    
    my $group_id = $sth->fetchrow;
    
    #属する返信もすべて作条
    $sth = $dbh->prepare("DELETE FROM reply WHERE topic_id = ?");
    $sth->bind_param ( 1, $_[0]);
    my $applied = $sth -> execute();
    
    
    $sth = $dbh->prepare("DELETE FROM topic WHERE topic_id = ?");
    
    $sth->bind_param ( 1, $_[0]);
    
    $applied = $sth -> execute();
    $result = $applied ? 0 : 1;
	$sth -> finish;
	
    update_group_info($group_id);
    
	$dbh ->disconnect;
	return $result;
	
}

#func: reply topic
#param: topic_id, user_id, reply_time, content
#return: 0 = reply success, 1 = reply fail
sub reply_topic {
	my $result = 0;
    
	my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    # 返信を入れる
    my $sth = $dbh->prepare("INSERT INTO reply(topic_id, user_id, reply_time, content) VALUES( ?, ?, ?, ?)");
    
    $sth->bind_param ( 1, $_[0]);
    $sth->bind_param ( 2, $_[1]);
    $sth->bind_param ( 3, $_[2]);
    $sth->bind_param ( 4, $_[3]);
    
    my $applied = $sth -> execute();
    $result = $applied ? 0 : 1;
	
    $sth = $dbh->prepare("SELECT count(*) FROM reply WHERE topic_id = ?");
    $sth->bind_param(1, $_[0]);
    $sth -> execute();
    
    $applied = $sth -> execute();
    my $replyCount = ($sth->fetchrow);
    #属するトピックのlast_reply_people, last_reply_timeを更新
    $sth = $dbh->prepare("UPDATE topic SET reply_count = ?, last_reply_people = ?, last_reply_time = ? WHERE topic_id = ?");
    
    $sth->bind_param ( 1, $replyCount);
    $sth->bind_param ( 2, $_[1]);
    $sth->bind_param ( 3, $_[2]);
    $sth->bind_param ( 4, $_[0]);
    $sth -> execute();
    $result = $applied ? 0 : 1;
	
    
	$sth -> finish;
	$dbh ->disconnect;
	
	return $result;
    
}

#print delete_reply(2);
#func: 返信を削除
#param: reply_id
#return: 0 = delete success, 1 = delete fail
sub delete_reply{
	my $result = 0;
	my $dbh = DBI -> connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    
    
    my $sth = $dbh->prepare("DELETE FROM reply WHERE reply_id = ?");
    
    $sth->bind_param ( 1, $_[0]);
    
    my $applied = $sth -> execute();
    $result = $applied ? 0 : 1;
	$sth -> finish;
	
	$dbh ->disconnect;
	return $result;
	
}


#my @t = get_reply(1,2, 5);

#for (my $i = 0; $i <= $#t; $i ++){
#for (my $j = 0; $j <= 3; $j ++){
#print $t[$i][$j] , " ";
#}
#print "\n";
#}

#返信を読み込め
#param: page_number, post_per_page, topic_id;
#result: array { user_name, reply_id, reply_time, content, user_id}
sub get_reply{
    my @result;
    my $dbh = DBI ->connect ($dsn, $user, $password);
    $dbh->do("set names utf8");
    
    
    my $sth = $dbh->prepare("SELECT user_info.user_name, reply.reply_id, reply.reply_time, reply.content,reply.user_id FROM user_info, reply WHERE user_info.user_id = reply.user_id AND reply.topic_id = ? ORDER BY reply.reply_time LIMIT ? OFFSET ?;");
    $sth->bind_param ( 1,  $_[2]);
    $sth->bind_param ( 2,  $_[1]);
    $sth->bind_param ( 3, ($_[0] - 1) * $_[1]);
    
    $sth -> execute();
    
    while (my @data = $sth->fetchrow){
        push @result, [$data[0], $data[1], $data[2], $data[3], $data[4]];
    }
    return @result;
}


1;