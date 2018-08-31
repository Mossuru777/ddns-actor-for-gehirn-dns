# GehirnDNSを使ってDDNSっぽくするやつ

## introduction

README.md is written Japanese.

If you are necessary README.md written by English, Please write the issue.

このREADME.mdですが、英語で書こうと思ったんですがめんどくさくてやめました。  
そんなに需要ないだろうし。

なので、日本語わかんねーって人がいたらイシューしちゃってください。

## なにこれ

GehirnDNSのAPIを使って、特定のAレコードをお宅のグローバルIPアドレスに自動更新するためのスクリプトです。

## GehirnDNSってなんぞや

ググって

## どう使うの

cloneしてinstallしてconfig書いてtestしてstartします！

ざっくりと

1. 事前にGehirnDNSの方でDNS移管作業からレコード設定と、API作成をしておく。
2. `git clone https://github.com/wd-shiroma/ddns-actor-for-gehirn-dns.git`
3. `cd ddns-actor-for-gehirn-dns`
4. `npm install`
5. `cp config.js.sample config.js`
6. `vim config.js`
7. `npm test`
8. `npm start`

コレでうまく行けばAレコードがお宅のグローバルIPアドレスに更新されているはず。

あとはcronなりsystemd.timerなりを使って善きに計らってください。

## 必要環境とか

多分Node.js入ってれば動く。

バージョンは知らんけどとりあえずv8以降を使っておけばいいんじゃないかな。  
(おそらくv6系でも動きそうな気がするけど。。。)

async使える環境ならきっとたぶん動くはず。

## FAQ

- 動かない！  
とりあえずイシューしてみて。
- 説明が雑！  
ごめんね
- 問い合わせ先は！？  
マストドンに生息しています。： [@guskma@abyss.fun](https://abyss.fun/@guskma)

