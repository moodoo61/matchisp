# RADIUS — RouterOS — وثائق MikroTik

> ترجمة الشرح فقط إلى العربية. المصطلحات التقنية، أسماء الخصائص، المتغيرات، الأوامر، وأمثلة الكود تُبقى كما في الأصل.

المصدر: https://help.mikrotik.com/docs/spaces/ROS/pages/328097/RADIUS

# RADIUS

## ملخص (Summary)

RADIUS، اختصارًا لـ Remote Authentication Dial-In User Service، هو خادم بعيد يوفّر خدمات authentication و accounting لأجهزة الشبكة المختلفة. يتيح RADIUS authentication و accounting لمزوّد الخدمة أو مسؤول الشبكة إدارة وصول مستخدمي PPP ومحاسبتهم من خادم واحد عبر شبكة واسعة. يحتوي MikroTik RouterOS على RADIUS client يمكنه مصادقة مستخدمي الراوتر المحليين، وHotSpot، وPPP، وPPPoE، وPPTP، وL2TP، وOVPN، وSSTP، وIPsec، واتصالات ISDN. السمات المستلمة من RADIUS server تتجاوز تلك المضبوطة في default profile، أما إن لم تُستلم بعض المعاملات فتُؤخذ من الـ default profile المناسب.

لا يُستشار قاعدة بيانات RADIUS server إلا إذا لم يُعثر على سجل وصول مطابق في قاعدة البيانات المحلية للموجّه.

إذا كان RADIUS accounting مفعّلًا، تُرسل معلومات المحاسبة أيضًا إلى RADIUS server الافتراضي لتلك الخدمة.

## عميل RADIUS (RADIUS Client)

**Sub-menu:** `/radius`

تتيح هذه القائمة الفرعية إضافة وإزالة RADIUS clients.

> **ملاحظة:** ترتيب العناصر المضافة في هذه القائمة مهم.

### الخصائص (Properties)

        ``````````````````````````````````
``
``
``
``
``
``
``````
| Property | Description |
| --- | --- |
| accounting-backup (yes | no; Default: no) | هل الإعداد مخصّص لـ RADIUS server احتياطي (backup) |
| accounting-port (integer [1..65535]; Default: 1813) | منفذ RADIUS server المستخدم لـ accounting |
| address (IPv4/IPv6 address; Default: 0.0.0.0) | عنوان IPv4 أو IPv6 لـ RADIUS server. الصيغ المقبولة: ipv4 — ipv4@vrf — ipv6 — ipv6@vrf |
| authentication-port (integer [1..65535]; Default: 1812) | منفذ RADIUS server المستخدم لـ authentication |
| called-id (string; Default: ) | القيمة تعتمد على بروتوكول Point-to-Point: PPPoE — service name؛ PPTP — عنوان IP للخادم؛ L2TP — عنوان IP للخادم |
| certificate (string; Default: ) | ملف الشهادة المستخدم للتواصل مع RADIUS Server عند تفعيل RadSec |
| comment (string; Default: ) | تعليق |
| disabled (yes | no; Default: no) | تعطيل العنصر |
| domain (string; Default: ) | نطاق Microsoft Windows للعميل، يُمرَّر إلى خوادم RADIUS التي تتطلب التحقق من الـ domain |
| protocol (radsec | udp; Default: udp) | البروتوكول المستخدم للتواصل مع RADIUS Server |
| radsec-timeout (time; Default: 3300ms) | المهلة التي بعدها يُعاد إرسال الطلب عبر بروتوكول RadSec |
| require-message-auth (no | yes-for-request-resp; Default: yes-for-request-resp) | هل سمات Message-Authenticator مطلوبة |
| realm (string; Default: ) | نطاق (user domain) مُصرَّح به صراحةً، حتى لا يضطر المستخدمون لإدخال اسم نطاق مزوّد الخدمة ضمن اسم المستخدم |
| secret (string; Default: ) sensitive | السر المشترك المستخدم للوصول إلى RADIUS server |
| service (ppp|login|hotspot|wireless|dhcp|ipsec|dot1x; Default: ) | خدمات الراوتر التي ستستخدم هذا RADIUS server: hotspot — خدمة مصادقة HotSpot login — مصادقة مستخدمي الراوتر المحليين ppp — مصادقة عملاء Point-to-Point wireless — مصادقة عملاء wireless dhcp — مصادقة عميل بروتوكول DHCP (يُرسل MAC address العميل كـ User-Name) ipsec — مصادقة عميل ipsec dot1x — مصادقة dot1x |
| src-address (ipv4/ipv6 address; Default: 0.0.0.0) | عنوان IP/IPv6 المصدر للحزم المرسلة إلى RADIUS server |
| timeout (time; Default: 1100ms) | المهلة التي بعدها يُعاد إرسال الطلب |

عندما يصادق RADIUS server المستخدم بـ CHAP أو MS-CHAPv1 أو MS-CHAPv2، فإنه لا يستخدم الـ shared secret في الطلب؛ يُستخدم السر فقط في رد المصادقة، ويتحقّق منه الراوتر (RADIUS client). لذلك إن كان الـ shared secret خاطئًا، سيقبل RADIUS server الطلب، لكن الراوتر لن يقبل الرد. يمكنك ملاحظة ذلك بأمر `/radius monitor`؛ يجب أن يزداد رقم `bad-replies` كلما حاول أحد الاتصال.

إذا كان RadSec مفعّلًا، تأكد أن RADIUS Server يستخدم `radsec` كـ shared secret، وإلا فلن يتمكّن من فك تشفير البيانات بشكل صحيح (محارف غير قابلة للطباعة). مع RadSec، يفرض RouterOS أن يكون الـ shared secret هو `radsec` بغض النظر عمّا ضُبط يدويًا. لمزيد من التفاصيل انظر RFC6614.

### مثال (Example)

لإعداد RADIUS Client لخدمتي HotSpot و PPP يصادقان عبر RADIUS Server على العنوان `10.0.0.3`:

```
[admin@MikroTik] > /radius add service=hotspot,ppp address=10.0.0.3 secret=ex
[admin@MikroTik] > /radius print
Flags: X - disabled
# SERVICE CALLED-ID DOMAIN ADDRESS SECRET
0 ppp,hotspot

```

لإعداد RADIUS Client مع RadSec:

```
[admin@MikroTik] > /radius add service=hotspot,ppp address=10.0.0.3 secret=radsec protocol=radsec certificate=client.crt
[admin@MikroTik] > /radius print
Flags: X - disabled
# SERVICE CALLED-ID DOMAIN ADDRESS SECRET
0 ppp,hotspot 10.0.0.3 radsec

```

تأكد أن الشهادة المحددة موثوقة وأن التحقق من common-name يعمل بشكل صحيح على الطرفين.

مثال بسيط للشهادات التي يمكن استخدامها لإعداد RADIUS RadSec:

```
On server:

#CN should be RADIUS server IP
/certificate/add name=radsec_server common-name=10.155.114.91
/certificate/sign radsec_server

#CN should be RADIUS client IP
/certificate/add name=radsec_client1 common-name=10.155.114.92
/certificate/sign radsec_client1
user-manager/set radsec-certificate=radsec_server

#Export certificates on the server in order to apply them on client
/certificate/export-certificate type=pkcs12 export-passphrase=verystrongpassword radsec_client1
/certificate/export-certificate type=pkcs12 radsec_server

On client:

#Download both files and upload them to the client
/certificate import file-name=cert_export_radsec_client1.p12 passphrase=verystrongpassword
/certificate import file-name=cert_export_radsec_server.p12
/radius/set <radius_client_id_in_list> certificate=cert_export_radsec_client1.p12_0

#After that when RADIUS client tries to connect to the server you should see on status fileld: status="TLS connected".

```

لعرض إحصاءات RADIUS Client:

```
[admin@MikroTik] > /radius monitor 0
pending: 0
requests: 10
accepts: 4
rejects: 1
resends: 15
timeouts: 5
bad-replies: 0
last-request-rtt: 0s

```

وتأكد من تفعيل RADIUS authentication للخدمات المطلوبة:

```
/ppp aaa set use-radius=yes
/ip hotspot profile set default use-radius=yes

```

## إنهاء الاتصال من RADIUS (Connection Terminating from RADIUS)

**Sub-menu:** `/radius incoming`

تدعم هذه الميزة الرسائل غير المطلوبة (unsolicited) المرسلة من RADIUS server. توسّع هذه الرسائل أوامر بروتوكول RADIUS بما يسمح بإنهاء جلسة متصلة أصلًا من جانب RADIUS server. لهذا الغرض تُستخدم رسائل DM (Disconnect-Messages). تسبب رسائل Disconnect إنهاء جلسة المستخدم فورًا.

> **ملاحظة:** RouterOS لا يدعم POD (Packet of Disconnect)، وهي حزمة RADIUS access request أخرى تؤدي وظيفة مشابهة لـ Disconnect Messages.

### الخصائص (Properties)

        ``````
| Property | Description |
| --- | --- |
| accept (yes | no; Default: no) | هل تُقبل الرسائل غير المطلوبة (unsolicited) |
| port (integer; Default: 1700) | رقم المنفذ للاستماع إلى الطلبات |
| vrf (VRF name; default value: main) | تعيين VRF الذي تستمع عليه الخدمة للاتصالات الواردة |

## سمات RADIUS المدعومة (Supported RADIUS Attributes)

من هنا يمكنك تنزيل قاموس مرجع RADIUS الذي يتضمن كل سمات RADIUS التي يدعمها جهاز MikroTik. الملف مصمَّم لـ FreeRADIUS، لكن يمكن استخدامه مع خوادم RADIUS أخرى. لاحظ أنه قد يتعارض مع ملف الإعداد الافتراضي لخادم RADIUS لديك؛ صحّح الإعداد وليس القاموس، إذ لا تُدعم سمات أخرى بواسطة MikroTik RouterOS. يوجد أيضًا قاموس MikroTik الخاص بـ RADIUS يمكن تضمينه في قاموس موجود لدعم سمات MikroTik الخاصة بالمورّد (vendor-specific).

فيما يلي وصف للسمات وكيفية استخدامها على أجهزة MikroTik أثناء التواصل مع RADIUS.

### تعريفات (Definitions)

- **PPPs** — PPP، PPTP، PPPoE

- **default configuration** — الإعدادات في default profile (لـ PPPs) أو إعدادات HotSpot server (لـ HotSpot)

### حزمة Access-Request

- `Service-Type` — دائمًا `Framed` (لـ PPPs فقط)

- `Framed-Protocol` — دائمًا `PPP` (لـ PPPs فقط)

- `NAS-Identifier` — اسم هوية الراوتر (identity)

- `NAS-IP-Address` — عنوان IP للراوتر نفسه

- `NAS-Port` — تشير هذه السمة إلى رقم المنفذ الفيزيائي لـ NAS الذي يصادق المستخدم

- `Acct-Session-Id` — معرّف جلسة فريد. الرمزان الأولان يمثّلان الخدمة (PPP، Hotspot، إلخ). الرمز التالي يزداد مع كل إعادة تشغيل. المجموعة الأخيرة تزداد مع كل جلسة جديدة. هذا يعني أنه لا يمكن الحصول على نفس المعرّف لمليون إعادة اتصال على نفس الإقلاع لنفس نوع خدمة RADIUS. إذا فُقدت رسالة إيقاف الجلسة وبقي RADIUS server يعتبر الجلسة مفتوحة ثم استقبل رسالة بدء جلسة جديدة، فيجب أن يدرك أن رسالة الإيقاف ضاعت، ويغلق الجلسة القديمة ويبدأ جلسة جديدة

- `NAS-Port-Type` — async PPP: `Async`؛ PPTP و L2TP: `Virtual`؛ PPPoE: `Ethernet`؛ ISDN: `ISDN Sync`؛ HotSpot: `Ethernet | Cable | Wireless-802.11` (حسب قيمة معامل `nas-port-type` في `/ip hotspot profile`)

- `Calling-Station-Id` — PPPoE و HotSpot: عنوان MAC للعميل بأحرف كبيرة؛ PPTP و L2TP: عنوان IP العام للعميل

- `Called-Station-Id` — PPPoE: اسم الخدمة؛ PPTP و L2TP: عنوان IP للخادم؛ HotSpot: اسم HotSpot server

- `NAS-Port-Id` — async PPP: اسم المنفذ التسلسلي؛ PPPoE: اسم واجهة ethernet التي يعمل عليها الخادم؛ HotSpot: اسم واجهة HotSpot الفيزيائية (إن كانت bridged يُعرض اسم منفذ الـ bridge)؛ غير موجودة لـ ISDN و PPTP و L2TP

- `Framed-IP-Address` — عنوان IP لعميل HotSpot بعد ترجمة Universal Client

- `Mikrotik-Host-IP` — عنوان IP لعميل HotSpot قبل ترجمة Universal Client (العنوان الأصلي للعميل)

- `User-Name` — اسم دخول العميل

- `MS-CHAP-Domain` — نطاق المستخدم إن وُجد

- `Mikrotik-Realm` — إن ضُبط في قائمة `/radius` يُضمَّن في كل طلب RADIUS كسمة `Mikrotik-Realm`. وإن لم يُضبط، تُرسل نفس قيمة `MS-CHAP-Domain` (وإن غابت `MS-CHAP-Domain` فلا تُضمَّن Realm أصلًا)

- `WISPr-Location-ID` — نص مضبوط في خاصية `radius-location-id` لـ HotSpot server

- `WISPr-Location-Name` — نص مضبوط في خاصية `radius-location-name` لـ HotSpot server

- `WISPr-Logoff-URL` — رابط كامل لصفحة تسجيل الخروج (مثلًا `http://10.48.0.1/lv/logout`)

حسب طرق المصادقة (ملاحظة: HotSpot يستخدم CHAP افتراضيًا وقد يستخدم PAP أيضًا إن كانت كلمات المرور غير المشفّرة مفعّلة؛ ولا يمكنه استخدام MSCHAP):

- `User-Password` — كلمة مرور مشفّرة (مع PAP authentication)

- `CHAP-Password`، `CHAP-Challenge` — كلمة مرور مشفّرة وchallenge (مع CHAP authentication)

- `MS-CHAP-Response`، `MS-CHAP-Challenge` — كلمة مرور مشفّرة وchallenge (مع MS-CHAPv1 authentication)

- `MS-CHAP2-Response`، `MS-CHAP-Challenge` — كلمة مرور مشفّرة وchallenge (مع MS-CHAPv2 authentication)

### حزمة Access-Accept

- `Framed-IP-Address` — عنوان IP يُعطى للعميل. إذا كان العنوان ينتمي إلى شبكات `127.0.0.0/8` أو `224.0.0.0/3`، يُستخدم IP pool من default profile لتخصيص عنوان للعميل. إذا حُدِّدت `Framed-IP-Address` تُتجاهل `Framed-Pool`

- `Framed-IP-Netmask` — قناع شبكة العميل. PPPs: إن حُدِّدت، تُنشأ route إلى الشبكة التي ينتمي إليها `Framed-IP-Address` عبر بوابة `Framed-IP-Address`؛ HotSpot: تُتجاهل بواسطة HotSpot

- `Framed-Pool` — اسم IP pool (على الراوتر) الذي منه يُؤخذ عنوان IP للعميل. إذا حُدِّدت `Framed-IP-Address` تُتجاهل هذه السمة

- `Framed-IPv6-Prefix` — بادئة IPv6 المخصّصة للعميل

- `Mikrotik-Delegated-IPv6-Pool` — مجمع IPv6 المستخدم لـ Prefix Delegation

- `Delegated-IPv6-Prefix` — بادئة IPv6

- `Delegated-IPv6-Prefix-Pool` — مجمع بادئات IPv6 لـ Prefix Delegation

> **ملاحظة:** ملاحظة: إذا حُدِّدت `Framed-IP-Address` أو `Framed-Pool` فإنها تتجاوز `remote-address` في default configuration.

- `Idle-Timeout` — يتجاوز idle-timeout في default configuration

- `Session-Timeout` — يتجاوز session-timeout في default configuration

- `Port-Limit` — العدد الأقصى للاتصالات المتزامنة بنفس اسم المستخدم (يتجاوز خاصية `shared-users` في بروفايل مستخدم HotSpot)

- `Class` — cookie؛ تُعاد ضمن Accounting-Request دون تغيير

- `Framed-Route` — مسارات تُضاف على الخادم. الصيغة محدّدة في RFC 2865 (الفصل 5.22)، ويمكن تحديدها مرات متعددة حسب الحاجة

- `Filter-Id` — اسم سلسلة firewall filter. تُستخدم لإنشاء قاعدة جدار ناري ديناميكية. يمكن أن يكون لاسم السلسلة لاحقة `.in` أو `.out` لتثبيت القاعدة للوارد أو الصادر فقط. يمكن تقديم عدة Filter-id، لكن تُستخدم آخر واحدة للوارد وآخر واحدة للصادر. لـ PPPs: قواعد filter في سلسلة `ppp` تقفز إلى السلسلة المحددة إذا جاءت الحزمة من/إلى العميل (أي يجب أولًا إنشاء سلسلة ppp وقواعد jump تضع الحركة الفعلية فيها). ينطبق الأمر نفسه على HotSpot لكن القواعد تُنشأ في سلسلة `hotspot`

- `Mikrotik-Mark-Id` — اسم سلسلة firewall mangle (HotSpot فقط). عند استلام هذه السمة ينشئ RADIUS client في MikroTik قاعدة mangle ديناميكية بـ `action=jump` و`chain=hotspot` و`jump-target` يساوي قيمة السمة. يمكن أن يكون لاسم سلسلة mangle لاحقة `.in` أو `.out`. يمكن تقديم عدة Mark-id وتُستخدم آخر واحدة للوارد وآخر واحدة للصادر

- `Acct-Interim-Interval` — interim-update لـ RADIUS client. PPP: إن كانت 0 تُستخدم القيمة المضبوطة في RADIUS client؛ HotSpot: تُحترم فقط إذا كان `radius-interim-update=received` في HotSpot server profile

- `MS-MPPE-Encryption-Policy` — خاصية require-encryption (PPPs فقط)

- `MS-MPPE-Encryption-Types` — خاصية use-encryption؛ قيمة غير صفرية تعني استخدام التشفير (PPPs فقط)

- `Ascend-Data-Rate` — حد معدل بيانات tx/rx؛ إن قُدِّمت سمات متعددة فالأولى تحدّ tx والثانية rx. إن استُخدمت مع `Ascend-Xmit-Rate` فتحدد معدل rx. 0 يعني بلا حد. تُتجاهل إن وُجدت سمة Rate-Limit

- `Ascend-Xmit-Rate` — حد معدل بيانات tx. يمكن استخدامها لتحديد حد الإرسال فقط بدل إرسال سمتين Ascend-Data-Rate متتاليتين (عندها Ascend-Data-Rate تحدد معدل الاستقبال). 0 بلا حد. تُتجاهل إن وُجدت سمة Rate-Limit

- `MS-CHAP2-Success` — رد المصادقة عند استخدام MS-CHAPv2 (PPPs فقط)

- `MS-MPPE-Send-Key`، `MS-MPPE-Recv-Key` — مفاتيح تشفير لـ PPPs المشفّرة يوفّرها RADIUS server فقط عند استخدام MS-CHAPv2 للمصادقة (PPPs فقط)

- `Ascend-Client-Gateway` — بوابة العميل لطريقة دخول HotSpot من نوع DHCP-pool (HotSpot فقط)

- `Mikrotik-Recv-Limit` — حد الاستقبال الإجمالي بالبايت للعميل

- `Mikrotik-Recv-Limit-Gigawords` — 4G (2^32) بايت من حد الاستقبال الإجمالي (البتات 32..63 عندما تُسلَّم البتات 0..31 في Mikrotik-Recv-Limit)

- `Mikrotik-Xmit-Limit` — حد الإرسال الإجمالي بالبايت للعميل

- `Mikrotik-Xmit-Limit-Gigawords` — 4G (2^32) بايت من حد الإرسال الإجمالي (البتات 32..63 عندما تُسلَّم البتات 0..31 في Mikrotik-Xmit-Limit)

- `Mikrotik-Wireless-Forward` — عدم إعادة توجيه إطارات العميل إلى البنية اللاسلكية إذا كانت القيمة `0` (Wireless فقط)

- `Mikrotik-Wireless-Skip-Dot1x` — تعطيل مصادقة 802.1x لهذا العميل اللاسلكي إن كانت القيمة غير صفرية (Wireless فقط)

- `Mikrotik-Wireless-Enc-Algo` — خوارزمية تشفير WEP: 0 بلا تشفير، 1 WEP بـ 40 بت، 2 WEP بـ 104 بت (Wireless فقط)

- `Mikrotik-Wireless-Enc-Key` — مفتاح تشفير WEP للعميل (Wireless فقط)

- `Mikrotik-Wireless-VLANID` — معرّف VLAN للعميل (Wireless فقط)

- `Mikrotik-Wireless-VLANID-type` — نوع معرّف VLAN للعميل. 0 وسم 802.1q و 1 وسم 802.1ad (Wireless فقط)

- `Mikrotik-Switching-Filter` — يسمح بإنشاء قواعد switch ديناميكية عند مصادقة العملاء عبر dot1x server

- `Mikrotik-Rate-Limit` — حد معدل البيانات للعملاء. الصيغة: `rx-rate[/tx-rate] [rx-burst-rate[/tx-burst-rate] [rx-burst-threshold[/tx-burst-threshold] [rx-burst-time[/tx-burst-time] [priority] [rx-rate-min[/tx-rate-min]]]]` من وجهة نظر الراوتر (إذن `rx` هو رفع العميل، و`tx` هو تنزيله). يجب أن تكون المعدلات أرقامًا مع لاحقة اختيارية `k` (آلاف) أو `M` (ملايين). إن لم يُحدد tx-rate يُستخدم rx-rate كـ tx-rate أيضًا. ونفس المنطق لـ tx-burst-rate و tx-burst-threshold و tx-burst-time. إن لم يُحدد كل من rx-burst-threshold و tx-burst-threshold (مع وجود burst-rate) يُستخدم rx-rate و tx-rate كعتبات burst. إن لم يُحدد كل من rx-burst-time و tx-burst-time فالقيمة الافتراضية 1s. تأخذ priority قيمًا 1..8 حيث 1 أعلى أولوية و 8 أدناها. إن لم يُحدد rx-rate-min و tx-rate-min تُستخدم قيم rx-rate و tx-rate. ولا يمكن أن تتجاوز قيم rx-rate-min و tx-rate-min قيم rx-rate و tx-rate

- `Mikrotik-Group` — اسم مجموعة المستخدمين المحليين على الراوتر (معرّفة في `/user group`) للمستخدمين المحليين؛ default profile لـ HotSpot لمستخدمي HotSpot؛ اسم default profile لـ PPP لمستخدمي PPP

- `Mikrotik-Advertise-URL` — رابط صفحة الإعلانات التي يجب عرضها للعملاء. إن حُدِّدت هذه السمة تُفعَّل الإعلانات تلقائيًا بما في ذلك transparent proxy حتى لو عُطِّلت صراحةً في بروفايل المستخدم. قد يرسل RADIUS server عدة نُسخ من السمة لتحديد روابط إضافية تُختار بأسلوب round robin

- `Mikrotik-Advertise-Interval` — الفاصل الزمني بين إعلانين متجاورين. قد تُرسل عدة نُسخ؛ تُعامل كل القيم كقائمة وتُؤخذ واحدة تلو الأخرى لكل إعلان ناجح. عند الوصول لنهاية القائمة تُستمر آخر قيمة

- `WISPr-Redirection-URL` — رابط يُوجَّه إليه العملاء بعد نجاح تسجيل الدخول

- `WISPr-Bandwidth-Min-Up` — الحد الأدنى لمعدل البيانات (CIR) لرفع العميل

- `WISPr-Bandwidth-Min-Down` — الحد الأدنى لمعدل البيانات (CIR) لتنزيل العميل

- `WISPr-Bandwidth-Max-Up` — الحد الأقصى لمعدل البيانات (MIR) لرفع العميل

- `WISPr-Bandwidth-Max-Down` — الحد الأقصى لمعدل البيانات (MIR) لتنزيل العميل

- `WISPr-Session-Terminate-Time` — الوقت الذي يجب عنده قطع المستخدم؛ بالصيغة `YYYY-MM-DDThh:mm:ssTZD` حيث Y السنة؛ M الشهر؛ D اليوم؛ T فاصل بين التاريخ والوقت؛ h الساعة (24 ساعة)؛ m الدقيقة؛ s الثانية؛ TZD المنطقة الزمنية بإحدى الصيغ: `+hh:mm`، `+hhmm`، `-hh:mm`، `-hhmm`

السمات المستلمة تتجاوز الافتراضية (المضبوطة في default profile)، لكن إن لم تُستلم سمة من RADIUS server تُستخدم القيمة الافتراضية. تأخذ Rate-Limit الأولوية على كل الطرق الأخرى لتحديد معدل بيانات العميل. سمات Ascend للمعدل تأتي ثانيًا؛ وسمات WISPr لها آخر أولوية.

أمثلة على Rate-Limit:

- `128k` — rx-rate=128000، tx-rate=128000 (بدون bursts)

- `64k/128M` — rx-rate=64000، tx-rate=128000000

- `64k 256k` — rx/tx-rate=64000، rx/tx-burst-rate=256000، rx/tx-burst-threshold=64000، rx/tx-burst-time=1s

- `64k/64k 256k/256k 128k/128k 10/10` — rx/tx-rate=64000، rx/tx-burst-rate=256000، rx/tx-burst-threshold=128000، rx/tx-burst-time=10s

### حزمة Accounting-Request

يحمل طلب المحاسبة نفس سمات Access Request، بالإضافة إلى:

- `Acct-Status-Type` — Start أو Stop أو Interim-Update

- `Acct-Authentic` — إما مصادق عبر RADIUS أو سلطة محلية (PPPs فقط)

- `Class` — cookie من RADIUS server كما استُلمت في Access-Accept

- `Acct-Delay-Time` — كم حاول الراوتر إرسال حزمة Accounting-Request هذه

### حزم Stop و Interim-Update من Accounting-Request

إضافةً إلى طلب بدء المحاسبة، تحتوي الرسائل التالية على السمات الآتية:

- `Acct-Session-Time` — مدة الاتصال بالثواني

- `Acct-Input-Octets` — البايتات المستلمة من العميل

- `Acct-Input-Gigawords` — 4G (2^32) بايت مستلمة من العميل (البتات 32..63 عندما تُسلَّم 0..31 في Acct-Input-Octets)

- `Acct-Input-Packets` — عدد الحزم المستلمة من العميل

- `Acct-Output-Octets` — البايتات المرسلة إلى العميل

- `Acct-Output-Gigawords` — 4G (2^32) بايت مرسلة إلى العميل (البتات 32..63 عندما تُسلَّم 0..31 في Acct-Output-Octets)

- `Acct-Output-Packets` — عدد الحزم المرسلة إلى العميل

تمثل رسائل RADIUS accounting في RouterOS الـ output كحركة من وجهة نظر العميل؛ مثلًا لمستخدم VPN اسمه `test` يكون الـ output هو رفع المستخدم.

### حزمة Stop Accounting-Request

هذه الحزم، إضافةً إلى حزم Interim Update، تحتوي على:

- `Acct-Terminate-Cause` — سبب إنهاء الجلسة (انظر RFC 2866 الفصل 5.10)

### Change of Authorization

يُدعم أيضًا قطع الاتصال عبر RADIUS و Change of Authorization (وفق RFC3576). يمكن تغيير السمات التالية بطلب CoA من RADIUS server:

- `Mikrotik-Group`

- `Mikrotik-Recv-Limit`

- `Mikrotik-Xmit-Limit`

- `Mikrotik-Rate-Limit`

- `Ascend-Data-Rate` (فقط إن لم تكن Mikrotik-Rate-Limit موجودة)

- `Ascend-XMit-Rate` (فقط إن لم تكن Mikrotik-Rate-Limit موجودة)

- `Mikrotik-Mark-Id`

- `Filter-Id`

- `Mikrotik-Advertise-Url`

- `Mikrotik-Advertise-Interval`

- `Session-Timeout`

- `Idle-Timeout`

- `Port-Limit`

> **ملاحظة:** لاحظ أنه لا يمكن تغيير عنوان IP أو الـ pool أو المسارات بهذه الطريقة — لمثل هذه التغييرات يجب قطع اتصال المستخدم أولًا.

## القيم الرقمية لسمات MikroTik الخاصة بـ RADIUS

### MikroTik Vendor-Specific (VendorID 14988)

| Name | VendorID | Value | RFC |
| --- | --- | --- | --- |
| MIKROTIK_RECV_LIMIT | 14988 | 1 |  |
| MIKROTIK_XMIT_LIMIT | 14988 | 2 |  |
| MIKROTIK_GROUP | 14988 | 3 |  |
| MIKROTIK_WIRELESS_FORWARD | 14988 | 4 |  |
| MIKROTIK_WIRELESS_SKIPDOT1X | 14988 | 5 |  |
| MIKROTIK_WIRELESS_ENCALGO | 14988 | 6 |  |
| MIKROTIK_WIRELESS_ENCKEY | 14988 | 7 |  |
| MIKROTIK_RATE_LIMIT | 14988 | 8 |  |
| MIKROTIK_REALM | 14988 | 9 |  |
| MIKROTIK_HOST_IP | 14988 | 10 |  |
| MIKROTIK_MARK_ID | 14988 | 11 |  |
| MIKROTIK_ADVERTISE_URL | 14988 | 12 |  |
| MIKROTIK_ADVERTISE_INTERVAL | 14988 | 13 |  |
| MIKROTIK_RECV_LIMIT_GIGAWORDS | 14988 | 14 |  |
| MIKROTIK_XMIT_LIMIT_GIGAWORDS | 14988 | 15 |  |
| MIKROTIK_WIRELESS_PSK | 14988 | 16 |  |
| MIKROTIK_TOTAL_LIMIT | 14988 | 17 |  |
| MIKROTIK_TOTAL_LIMIT_GIGAWORDS | 14988 | 18 |  |
| MIKROTIK_ADDRESS_LIST | 14988 | 19 |  |
| MIKROTIK_WIRELESS_MPKEY | 14988 | 20 |  |
| MIKROTIK_WIRELESS_COMMENT | 14988 | 21 |  |
| MIKROTIK_DELEGATED_IPV6_POOL | 14988 | 22 |  |
| MIKROTIK_DHCP_OPTION_SET | 14988 | 23 |  |
| MIKROTIK_DHCP_OPTION_PARAM_STR1 | 14988 | 24 |  |
| MIKROTIK_DHCP_OPTION_PARAM_STR2 | 14988 | 25 |  |
| MIKROTIK_WIRELESS_VLANID | 14988 | 26 |  |
| MIKROTIK_WIRELESS_VLANIDTYPE | 14988 | 27 |  |
| MIKROTIK_WIRELESS_MINSIGNAL | 14988 | 28 |  |
| MIKROTIK_WIRELESS_MAXSIGNAL | 14988 | 29 |  |

### سمات قياسية وVendor أخرى

| Name | VendorID | Value | RFC |
| --- | --- | --- | --- |
| Acct-Authentic |  | 45 | RFC 2866 |
| Acct-Delay-Time |  | 41 | RFC 2866 |
| Acct-Input-Gigawords |  | 52 | RFC 2869 |
| Acct-Input-Octets |  | 42 | RFC 2866 |
| Acct-Input-Packets |  | 47 | RFC 2866 |
| Acct-Interim-Interval |  | 85 | RFC 2869 |
| Acct-Output-Gigawords |  | 53 | RFC 2869 |
| Acct-Output-Octets |  | 43 | RFC 2866 |
| Acct-Output-Packets |  | 48 | RFC 2866 |
| Acct-Session-Id |  | 44 | RFC 2866 |
| Acct-Session-Time |  | 46 | RFC 2866 |
| Acct-Status-Type |  | 40 | RFC 2866 |
| Acct-Terminate-Cause |  | 49 | RFC 2866 |
| Ascend-Client-Gateway | 529 | 132 |  |
| Ascend-Data-Rate | 529 | 197 |  |
| Ascend-Xmit-Rate | 529 | 255 |  |
| Called-Station-Id |  | 30 | RFC 2865 |
| Calling-Station-Id |  | 31 | RFC 2865 |
| CHAP-Challenge |  | 60 | RFC 2866 |
| CHAP-Password |  | 3 | RFC 2865 |
| Class |  | 25 | RFC 2865 |
| Filter-Id |  | 11 | RFC 2865 |
| Framed-Compression |  | 53 | RFC 2865 |
| Framed-IP-Address |  | 8 | RFC 2865 |
| Framed-IP-Netmask |  | 9 | RFC 2865 |
| Framed-IPv6-Prefix |  | 97 | RFC 3162 |
| Framed-Mtu |  | 52 | RFC 2869 |
| Framed-Pool |  | 88 | RFC 2869 |
| Framed-Protocol |  | 7 | RFC 2865 |
| Framed-Route |  | 22 | RFC 2865 |
| Framed-Routing |  | 50 | RFC 2865 |
| Idle-Timeout |  | 28 | RFC 2865 |
| MS-CHAP-Challenge | 311 | 11 | RFC 2548 |
| MS-CHAP-Domain | 311 | 10 | RFC 2548 |
| MS-CHAP-Response | 311 | 1 | RFC 2548 |
| MS-CHAP2-Response | 311 | 25 | RFC 2548 |
| MS-CHAP2-Success | 311 | 26 | RFC 2548 |
| MS-MPPE-Encryption-Policy | 311 | 7 | RFC 2548 |
| MS-MPPE-Encryption-Types | 311 | 8 | RFC 2548 |
| MS-MPPE-Recv-Key | 311 | 17 | RFC 2548 |
| MS-MPPE-Send-Key | 311 | 16 | RFC 2548 |
| NAS-Identifier |  | 32 | RFC 2865 |
| NAS-Port |  | 5 | RFC 2865 |
| NAS-IP-Address |  | 4 | RFC 2865 |
| NAS-Port-Id |  | 87 | RFC 2869 |
| NAS-Port-Type |  | 61 | RFC 2865 |
| Port-Limit |  | 62 | RFC 2865 |
| Redback-Agent-Remote-Id | 2352 | 96 |  |
| Redback-Agent-Circuit-Id | 2352 | 97 |  |
| Service-Type |  | 6 | RFC 2865 |
| Session-Timeout |  | 27 | RFC 2865 |
| User-Name |  | 1 | RFC 2865 |
| User-Password |  | 2 | RFC 2865 |
| WISPr-Bandwidth-Max-Down | 14122 | 8 | wi-fi.org |
| WISPr-Bandwidth-Max-Up | 14122 | 7 | wi-fi.org |
| WISPr-Bandwidth-Min-Down | 14122 | 6 | wi-fi.org |
| WISPr-Bandwidth-Min-Up | 14122 | 5 | wi-fi.org |
| WISPr-Location-Id | 14122 | 1 | wi-fi.org |
| WISPr-Location-Name | 14122 | 2 | wi-fi.org |
| WISPr-Logoff-URL | 14122 | 3 | wi-fi.org |
| WISPr-Redirection-URL | 14122 | 4 | wi-fi.org |
| WISPr-Session-Terminate-Time | 14122 | 9 | wi-fi.org |
| WISPr-Session-Terminate-End-Of-Day | 14122 | 10 | wi-fi.org |
| WISPr-Billing-Class-Of-Service | 14122 | 11 | wi-fi.org |
