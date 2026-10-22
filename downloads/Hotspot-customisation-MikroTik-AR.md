# تخصيص HotSpot — RouterOS — وثائق MikroTik

> ترجمة الشرح فقط إلى العربية. المصطلحات التقنية، أسماء الملفات، المتغيرات، الأوامر، وأمثلة الكود تُبقى كما في الأصل.

# ملاحظة الموقع

هذا الموقع التوثيقي مجمّد، ولن تُجرى عليه تعديلات إضافية.

# تخصيص HotSpot (Hotspot customisation)

- أنشأه Normunds R.، آخر تحديث بواسطة GG في 08 Mar 2024 — قراءة تقارب 19 دقيقة

### المتطلبات (Requirements)

- HotSpot captive portal

### مقدمة (Introduction)

يمكنك إنشاء مجموعة مختلفة تمامًا من صفحات servlet لكل HotSpot server لديك، وذلك بتحديد المجلد عبر الخاصية `"html-override-directory"` في HotSpot server profile ضمن `/ip hotspot profile`. تُنسَخ صفحات servlet الافتراضية إلى المجلد `"hotspot"` مباشرة بعد إنشاء server profile. يمكن الوصول إلى هذا المجلد بالاتصال بالموجّه عبر FTP client. يمكنك نسخ هذا المجلد وتعديل الصفحات كما تشاء مستفيدًا من معلومات هذا القسم من الدليل. يُفضَّل تحرير الملفات يدويًا؛ لأن أدوات تحرير HTML الآلية قد تُفسد الصفحات بحذف المتغيرات أو أجزاء حيوية أخرى. بعد الانتهاء من تعديل المحتوى، ارفع المحتوى المعدَّل إلى مجلد مخصص على hotspot router، ثم عيّن قيمة الخاصية `"html-override-directory"` كمسار إلى مجلد HTML المخصص الجديد.

ملاحظة: إذا كان مسار `"html-override-directory"` مفقودًا أو فارغًا، فسيعود hotspot server إلى ملفات HTML الافتراضية.

### الصفحات المتاحة (Available Pages)

صفحات HTML servlet الرئيسية التي تُعرض للمستخدم:

- `redirect.html` — تعيد توجيه المستخدم إلى URL آخر (مثلًا إلى صفحة login)
- `login.html` — صفحة تسجيل الدخول التي تطلب username و password. قد تقبل المعاملات التالية:

- `username` — اسم المستخدم
- `password` — إما كلمة مرور plain-text (في حالة PAP authentication) أو MD5 hash لـ متغير `chap-id` وكلمة المرور و CHAP challenge (في حالة CHAP authentication). تُستخدم هذه القيمة كـ e-mail address لمستخدمي trial
- `dst` — الـ URL الأصلي المطلوب قبل الـ redirect. يُفتح بعد نجاح login
- `popup` — هل تُفتح نافذة status عند نجاح login
- `radius <id>` — إرسال الـ attribute المحدد كـ text string إلى RADIUS server (عند استخدام RADIUS authentication؛ وإلا يُهمَل)
- `radius <id> u` — إرسال الـ attribute المحدد كـ unsigned integer إلى RADIUS server (عند استخدام RADIUS authentication؛ وإلا يُهمَل)
- `radius <id>-<vendor> ` — إرسال الـ attribute المحدد مع vendor ID كـ text string إلى RADIUS server (عند استخدام RADIUS authentication؛ وإلا يُهمَل)
- `radius <id>-<vendor> u` — إرسال الـ attribute المحدد مع vendor ID كـ unsigned integer إلى RADIUS server (عند استخدام RADIUS authentication؛ وإلا يُهمَل)
- `md5.js` — JavaScript لتجزئة كلمة المرور بـ MD5. يُستخدم مع طريقة login من نوع `http-chap`
- `alogin.html` — الصفحة المعروضة بعد أن يسجّل client دخوله. تفتح صفحة status وتعيد توجيه المتصفح إلى الصفحة المطلوبة أصلًا (قبل إعادة التوجيه إلى HotSpot login page)
- `status.html` — صفحة الحالة؛ تعرض إحصاءات الـ client. ويمكنها أيضًا عرض advertisements تلقائيًا
- `logout.html` — صفحة تسجيل الخروج؛ تُعرض بعد logout. تعرض الإحصاءات النهائية للجلسة المنتهية. قد تقبل المعاملات الإضافية التالية:

- `erase-cookie` — هل تُمسح cookies من HotSpot server عند logout (يمنع login تلقائيًا عبر cookie في المرة التالية من نفس المتصفح؛ مفيد في بيئات multiuser)
- `error.html` — صفحة الأخطاء؛ تُعرض عند الأخطاء القاتلة فقط

وهناك صفحات أخرى عند الحاجة لمزيد من التحكم:

- `rlogin.html` — تعيد توجيه الـ client من URL آخر إلى login page إذا كانت authorization مطلوبة للوصول إلى ذلك الـ URL
- `rstatus.html` — مشابهة لـ `rlogin.html`، لكن عندما يكون الـ client مسجّل الدخول أصلًا والـ URL الأصلي غير معروف
- `radvert.html` — تعيد توجيه الـ client إلى رابط advertisement المجدول
- `flogin.html` — تُعرض بدلًا من `login.html` عند حدوث خطأ (مثل username أو password غير صالح)
- `fstatus.html` — تُعرض بدلًا من redirect عند طلب status page بينما الـ client غير مسجّل الدخول
- `flogout.html` — تُعرض بدلًا من redirect عند طلب logout page بينما الـ client غير مسجّل الدخول

### خدمة صفحات Servlet (Serving Servlet Pages)

يتعرّف HotSpot servlet على 5 أنواع طلبات مختلفة:

1. طلب لمضيف بعيد (remote host)

- إذا كان المستخدم مسجّل الدخول وحان موعد عرض advertisement، تُعرض `radvert.html`. هذه الصفحة تعيد التوجيه إلى صفحة advertisement المجدولة
- إذا كان المستخدم مسجّل الدخول ولا يوجد advertisement مجدول لهذا المستخدم، تُخدَّم الصفحة المطلوبة
- إذا لم يكن المستخدم مسجّل الدخول، لكن الوجهة مسموحة عبر walled garden، فيُخدَّم الطلب أيضًا
- إذا لم يكن المستخدم مسجّل الدخول، والوجهة ممنوعة عبر walled garden، تُعرض `rlogin.html`؛ وإن لم تُوجَد، تُستخدم `redirect.html` لإعادة التوجيه إلى login page

2. طلب لـ `"/"` على مضيف HotSpot

- إذا كان المستخدم مسجّل الدخول، تُعرض `rstatus.html`؛ وإن لم تُوجَد، تُستخدم `redirect.html` لإعادة التوجيه إلى status page
- إذا لم يكن المستخدم مسجّل الدخول، تُعرض `rlogin.html`؛ وإن لم تُوجَد، تُستخدم `redirect.html` لإعادة التوجيه إلى login page

3. طلب لصفحة `"/login"`

- إذا نجح login (أو كان المستخدم مسجّلًا مسبقًا)، تُعرض `alogin.html`؛ وإن لم تُوجَد، تُستخدم `redirect.html` لإعادة التوجيه إلى الصفحة المطلوبة أصلًا أو إلى status page (إن لم تُعطَ الوجهة الأصلية)
- إذا لم يكن المستخدم مسجّل الدخول (لم يُرسَل username ولم تظهر رسالة خطأ)، تُعرض `login.html`
- إذا فشلت عملية login (وُجدت رسالة خطأ)، تُعرض `flogin.html`؛ وإن لم تُوجَد، تُستخدم `login.html`
- في حالة الأخطاء القاتلة، تُعرض `error.html`

4. طلب لصفحة `"/status"`

- إذا كان المستخدم مسجّل الدخول، تُعرض `status.html`
- إذا لم يكن مسجّل الدخول، تُعرض `fstatus.html`؛ وإن لم تُوجَد، تُستخدم `redirect.html` لإعادة التوجيه إلى login page

5. طلب لصفحة `'/logout'`

- إذا كان المستخدم مسجّل الدخول، تُعرض `logout.html`
- إذا لم يكن مسجّل الدخول، تُعرض `flogout.html`؛ وإن لم تُوجَد، تُستخدم `redirect.html` لإعادة التوجيه إلى login page

ملاحظة: إذا تعذّر تلبية الطلب باستخدام الصفحات المخزَّنة على FTP server الخاص بالموجّه، تُعرض Error 404

هناك طرق عديدة لتخصيص مظهر صفحات HotSpot authentication:

- الصفحات قابلة للتعديل بسهولة. تُخزَّن على FTP server الخاص بالموجّه في المجلد الذي تختاره لـ HotSpot server profile المعني.
- بتغيير المتغيرات التي يرسلها الـ client إلى HotSpot servlet، يمكن تقليل عدد الحقول المطلوبة إلى واحد (username أو password؛ مثلًا يمكن استخدام MAC address للـ client كقيمة أخرى) أو حتى إلى صفر (مثل License Agreement؛ يمكن استخدام قيم جاهزة عامة لجميع المستخدمين أو MAC address كـ username و password)
- قد تتم registration على خادم مختلف (مثلًا خادم يقبل Credit Cards). يمكن تمرير MAC address للـ client إليه حتى لا يُدخَل يدويًا. بعد التسجيل، يجب أن يعدّل الخادم قاعدة بيانات RADIUS لتمكين الـ client من login لمدة معيّنة.

لإدراج متغير في مكان ما داخل ملف HTML، تُستخدم الصيغة `$(var_name)` حيث `"var_name"` هو اسم المتغير (بدون علامات اقتباس). يمكن استخدام هذا التركيب في أي ملف HotSpot HTML يُوصَل إليه كـ `'/'` أو `'/login'` أو `'/status'` أو `'/logout'`، وكذلك أي ملف نصي أو HTML (`.txt` أو `.htm` أو `.html`) مخزَّن على HotSpot server (باستثناء traffic counters المتاحة في status page فقط، ومتغيرات `error` و `error-orig` و `chap-id` و `chap-challenge` و `popup` المتاحة في login page فقط). مثال لإظهار رابط إلى login page:

```
<a href="$(link-login)">login</a>

```

### المتغيرات (Variables)

تستخدم جميع صفحات Servlet HTML متغيراتًا لعرض قيم خاصة بالمستخدم. تظهر أسماء المتغيرات فقط في مصدر HTML لصفحات servlet — ويستبدلها HotSpot Servlet تلقائيًا بالقيم المناسبة. لمعظم المتغيرات يوجد مثال لقيمة محتملة بين أقواس. جميع المتغيرات الموصوفة صالحة في كل صفحات servlet، لكن بعضها قد يكون فارغًا وقت الوصول إليه (مثلًا لا يوجد uptime قبل أن يسجّل المستخدم دخوله).

#### قائمة المتغيرات المتاحة (List of available variables)

ملاحظة: بعض المتغيرات تستخدم http URL مضمّنًا بشكل ثابت؛ إذا كنت تستخدم https يمكنك بناء الرابط بطريقة أخرى، مثلًا لـ `$link-status` استخدم: `https://$(hostname)/$(target-dir)status`

متغيرات الخادم العامة (Common server variables):

- `hostname` — DNS name أو IP address (إن لم يُعطَ DNS name) لـ HotSpot Servlet (`"hotspot.example.net"`)
- `identity` — اسم الهوية في RouterOS (`"MikroTik"`)
- `login-by` — طريقة authentication التي استخدمها المستخدم
- `plain-passwd` — تمثيل `"yes/no"` لما إذا كانت طريقة HTTP-PAP login مسموحة (`"no"`)
- `server-address` — عنوان HotSpot server (`"10.5.50.1:80"`)
- `ssl-login` — تمثيل `"yes/no"` لما إذا استُخدم HTTPS للوصول إلى صفحة servlet هذه (`"no"`)
- `server-name` — اسم HotSpot server (يُضبط في قائمة `/ip hotspot` عبر الخاصية `name`)

الروابط (Links):

- `link-login` — رابط إلى login page يتضمن الـ URL الأصلي المطلوب (`"http://10.5.50.1/login?dst=http://www.example.com/"`)
- `link-login-only` — رابط إلى login page دون الـ URL الأصلي (`"http://10.5.50.1/login"`)
- `link-logout` — رابط إلى logout page (`"http://10.5.50.1/logout"`)
- `link-status` — رابط إلى status page (`"http://10.5.50.1/status"`)
- `link-orig` — الـ URL الأصلي المطلوب (`"http://www.example.com/"`)

معلومات عامة عن الـ client:

- `domain` — domain name للمستخدم (`"example.com"`)
- `interface-name` — اسم واجهة HotSpot الفعلية (في حالة bridged interfaces يُرجع اسم bridge port الفعلي)
- `ip` — عنوان IP للـ client (`"10.5.50.2"`)
- `logged-in` — `"yes"` إذا كان المستخدم مسجّل الدخول، وإلا `"no"` (`"yes"`)
- `mac` — عنوان MAC للمستخدم (`"01:23:45:67:89:AB"`)
- `trial` — تمثيل `"yes/no"` لما إذا كان للمستخدم وصول إلى trial time. إذا انتهت مدة trial يصبح القيمة `"no"`
- `username` — اسم المستخدم (`"John"`)
- `host-ip` — عنوان IP للـ client من جدول `/ip hotspot host`
- `vlan-id` — يمثل ID لواجهة VLAN التي يتصل منها الـ client

معلومات حالة المستخدم (User status information):

- `idle-timeout` — مهلة الخمول (`"20m"` أو `""` إن لم توجد)
- `idle-timeout-secs` — مهلة الخمول بالثواني (`"88"` أو `"0"` إن لم توجد)
- `limit-bytes-in` — حد البايتات للإرسال (`"1000000"` أو `"---"` إن لم يوجد حد)
- `limit-bytes-out` — حد البايتات للاستقبال (`"1000000"` أو `"---"` إن لم يوجد حد)
- `refresh-timeout` — مهلة تحديث status page (`"1m30s"` أو `""` إن لم توجد)
- `refresh-timeout-secs` — مهلة تحديث status page بالثواني (`"90s"` أو `"0"` إن لم توجد)
- `session-timeout` — الوقت المتبقي للجلسة (`"5h"` أو `""` إن لم يوجد)
- `session-timeout-secs` — الوقت المتبقي للجلسة بالثواني (`"3475"` أو `"0"` إن لم يوجد)
- `session-time-left` — الوقت المتبقي للجلسة (`"5h"` أو `""` إن لم يوجد)
- `session-time-left-secs` — الوقت المتبقي للجلسة بالثواني (`"3475"` أو `"0"` إن لم يوجد)
- `uptime` — مدة الجلسة الحالية (`"10h2m33s"`)
- `uptime-secs` — مدة الجلسة الحالية بالثواني (`"125"`)

عدّادات الحركة (Traffic counters) — متاحة في status page فقط:

- `bytes-in` — عدد البايتات المستلمة من المستخدم (`"15423"`)
- `bytes-in-nice` — عرض مقروء لعدد البايتات المستلمة من المستخدم (`"15423"`)
- `bytes-out` — عدد البايتات المرسلة إلى المستخدم (`"11352"`)
- `bytes-out-nice` — عرض مقروء لعدد البايتات المرسلة إلى المستخدم (`"11352"`)
- `packets-in` — عدد الحزم المستلمة من المستخدم (`"251"`)
- `packets-out` — عدد الحزم المرسلة إلى المستخدم (`"211"`)
- `remain-bytes-in` — البايتات المتبقية حتى بلوغ `limit-bytes-in` (`"337465"` أو `"---"` إن لم يوجد حد)
- `remain-bytes-out` — البايتات المتبقية حتى بلوغ `limit-bytes-out` (`"124455"` أو `"---"` إن لم يوجد حد)

متغيرات متنوعة (Miscellaneous variables):

- `session-id` — قيمة معامل `'session-id'` في آخر طلب
- `var` — قيمة معامل `'var'` في آخر طلب
- `error` — رسالة الخطأ عند الفشل (`"invalid username or password"`)
- `error-orig` — رسالة الخطأ الأصلية (بدون الترجمات من `errors.txt`) عند الفشل (`"invalid username or password"`)
- `chap-id` — قيمة chap ID (`"\371"`)
- `chap-challenge` — قيمة chap challenge (`"\357\015\330\013\021\234\145\245\303\253\142\246\133\175\375\316"`)
- `popup` — هل مربع اختيار الـ pop-up مفعّل (`"true"` أو `"false"`)
- `advert-pending` — هل هناك advertisement بانتظار العرض (`"yes"` أو `"no"`)
- `http-status` — يسمح بتعيين http status code والرسالة
- `http-header` — يسمح بتعيين http header

متغيرات مرتبطة بـ RADIUS:

- `radius <id>` — عرض الـ attribute المحدد كـ text string (عند استخدام RADIUS authentication؛ وإلا `""`)
- `radius <id> u` — عرض الـ attribute المحدد كـ unsigned integer (عند استخدام RADIUS authentication؛ وإلا `"0"`)
- `radius <id>-<vendor>` — عرض الـ attribute المحدد مع vendor ID كـ text string (عند استخدام RADIUS authentication؛ وإلا `""`)
- `radius <id>-<vendor> u` — عرض الـ attribute المحدد مع vendor ID كـ unsigned integer (عند استخدام RADIUS authentication؛ وإلا `"0"`)

#### العمل مع المتغيرات (Working with variables)

يمكن استخدام عبارات `$(if <var_name>)` في هذه الصفحات. يُدرَج المحتوى التالي إذا لم تكن قيمة `<var_name>` سلسلة فارغة. وهذا يكافئ `$(if <var_name> != "")`. ويمكن أيضًا المقارنة بالمساواة: `$(if <var_name> == <value>)`. يمتد أثر هذه العبارات حتى `$(elif <var_name>)` أو `$(else)` أو `$(endif)`. الشكل العام:

```
some content, which will always be displayed
$(if username == john)
Hey, your username is john
$(elif username == dizzy)
Hello, Dizzy! How are you? Your administrator.
$(elif ip == 10.1.2.3)
You are sitting at that old computer, which is so slow...
$(elif mac == 00:01:02:03:04:05)
This is an ethernet card, which was stolen few months ago...
$(else)
I don't know who you are, so lets live in peace.
$(endif)
other content, which will always be displayed

```

سيُعرض تعبير واحد فقط من هذه التعبيرات. أيّها يُعرض يعتمد على قيم تلك المتغيرات لكل client.

#### إعادة التوجيه والـ Headers المخصصة (Redirects and custom Headers)

```
	$(if http-status == 302)Hotspot login required$(endif)
	$(if http-header == "Location")$(link-redirect)$(endif)

```

ملاحظة: رغم أن المثال أعلاه يبدو كأنه يستخدم تعبير الشرط `if`، فهو في الواقع *يعيّن* قيمة `'http-status'` إلى `'302'` وليس يختبرها. والأمر نفسه لمتغير `'http-header'`: رغم استخدام `if`، فهو يعيّن المتغير إلى `'Location'` متبوعًا بالـ URL من متغير `'link-redirect'`.

مثلًا، إذا قُيِّم `$(link-redirect)` إلى `"http://192.168.88.1/login"`، فستتغير استجابة HTTP المعادة للـ client إلى:

```
HTTP/1.0 302 Hotspot login required
<regular HTTP headers>
Location: http://192.168.88.1/login

```

صيغة `http-status`:

```
	$(if http-status == XYZ)HTTP_STATUS_MESSAGE$(endif)

```

- `XYZ` — رمز الحالة الذي تريد إرجاعه. يجب أن يكون 3 أرقام عشرية، والأول يجب ألا يكون 0
- `HTTP_STATUS_MESSAGE` — أي نص تريد إرجاعه للـ client بعد رمز الحالة في رد HTTP

في أي استجابة HTTP سيكون ذلك في السطر الأول كالتالي:

```
HTTP/1.0 XYZ HTTP_STATUS_MESSAGE

```

صيغة `http-header`:

```
$(if http-header == HTTP_HEADER_NAME)HTTP_HEADER_VALUE$(endif)

```

- `HTTP_HEADER_NAME` — اسم الـ HTTP header المرسل في الاستجابة
- `HTTP_HEADER_VALUE` — قيمة الـ HTTP header ذي الاسم `HTTP_HEADER_NAME` المرسلة في الاستجابة

ستظهر استجابة HTTP كالتالي:

```
HTTP_HEADER_NAME: HTTP_HEADER_VALUE

```

تُعالَج جميع المتغيرات والتعابير الشرطية داخل `HTTP_HEADER_VALUE` و `HTTP_STATUS_MESSAGE` بالطريقة المعتادة.

إذا أُضيفت عدة headers بنفس الاسم، تُستخدم الأخيرة فقط (وتُهمَل السابقة). هذا يسمح بتجاوز HTTP headers العادية (مثل `Content-Type` و `Cache-Control`).

### تخصيص رسائل الخطأ (Customizing Error Messages)

تُخزَّن جميع رسائل الخطأ في الملف `errors.txt` داخل مجلد HotSpot servlet المعني. يمكنك تغييرها وترجمتها إلى لغتك. للقيام بذلك حرّر `errors.txt`. ويمكنك أيضًا استخدام المتغيرات داخل الرسائل. جميع التعليمات موجودة داخل ذلك الملف.

### إصدارات متعددة لصفحات HotSpot (Multiple Versions of HotSpot Pages)

يُدعم وجود مجموعات صفحات HotSpot متعددة لنفس HotSpot server. يمكن للمستخدم اختيارها (لاختيار اللغة) أو اختيارها تلقائيًا عبر JavaScript (لاختيار نسخة PDA مقابل النسخة العادية من صفحات HTML).

لاستخدام هذه الميزة، أنشئ مجلدات فرعية داخل مجلد HotSpot HTML، وضع فيها ملفات HTML المختلفة فقط. مثلًا للترجمة إلى اللاتفية، يمكن إنشاء المجلد الفرعي `"lv"` وبداخله `login.html` و `logout.html` و `status.html` و `alogin.html` و `radvert.html` و `errors.txt` مترجمة إلى اللاتفية. إذا لم تُوجَد صفحة HTML المطلوبة في المجلد الفرعي المطلوب، يُستخدم الملف المقابل من المجلد الرئيسي. عندئذٍ يحتوي `login.html` الرئيسي على رابط إلى `"/lv/login?dst=$(link-orig-esc)"` لعرض النسخة اللاتفية: Latviski. والنسخة اللاتفية تحتوي رابطًا إلى النسخة الإنجليزية: English.

طريقة أخرى للإشارة إلى المجلدات هي تحديد متغير `'target'`:

```
        <a href="$(link-login-only)?dst=$(link-orig-esc)&target=lv">Latviski</a>
        <a href="$(link-login-only)?dst=$(link-orig-esc)&target=%2F">English</a>

```

بعد اختيار المجلد المفضّل (مثل `"lv"`)، ستتضمن كل الروابط إلى صفحات HotSpot المحلية ذلك المسار (مثلًا `$(link-status)` = `"http://hotspot.mt.lv/lv/status"`). لذا إذا أشارت كل صفحات HotSpot إلى الروابط عبر متغيرات `"$(link-xxx)"`، فلا حاجة لتعديلات إضافية — سيبقى كل client داخل المجلد المختار طوال الوقت.

### متفرقات (Misc)

إذا أردت استخدام طريقة HTTP-CHAP authentication، يجب تضمين الدالة `doLogin()` (التي تعتمد على `md5.js` الذي يجب أن يكون محمّلًا مسبقًا) قبل إجراء Submit لنموذج login. وإلا سيفشل CHAP login.

كلمة المرور الناتجة التي تُرسَل إلى HotSpot gateway في حالة HTTP-CHAP تتكوّن من MD5-hash لسلسلة متتابعة من: `chap-id` ثم كلمة مرور المستخدم ثم `chap-challenge` (بهذا الترتيب).

إذا أردت استخدام المتغيرات مباشرة داخل رابط، فيجب تهريبها (escape) بشكل صحيح. مثلًا في login page، لن يعمل الرابط كما يُفترض إذا كان username هو `"123&456=1 2"`. في هذه الحالة بدلًا من `$(user)` استخدم النسخة المهرَّبة: `$(user-esc)`. عندئذٍ يتحول نفس الـ username إلى `"123%26456%3D1+2"` وهو التمثيل الصالح لـ `"123&456=1 2"` داخل URL. يمكن تطبيق هذه الحيلة على أي متغير وليس فقط `$(username)`.

يوجد معامل منطقي `"erase-cookie"` لصفحة logout، ويمكن أن يكون `"on"` أو `"true"` لحذف cookie المستخدم عند logout (حتى لا يُسجَّل دخوله تلقائيًا عند فتح المتصفح في المرة التالية).

### أمثلة (Examples)

بمعرفة أساسية بلغة HTML والأمثلة أدناه يفترض أن يسهل تطبيق الأفكار السابقة.

- لتوفير قيمة جاهزة كـ username، في `login.html` غيّر:

```
<type="text" value="$(username)>

```

إلى هذا السطر:

```
<input type="hidden" name="username" value="hsuser">

```

(حيث `hsuser` هو الـ username الذي توفّره)

- لتوفير قيمة جاهزة كـ password، في `login.html` غيّر:

```
<input type="password">

```

إلى هذا السطر:

```
<input type="hidden" name="password" value="hspass">

```

(حيث `hspass` هو الـ password الذي توفّره)

- لإرسال MAC address للـ client إلى خادم تسجيل بالشكل:

`https://www.example.com/register.html?mac=XX:XX:XX:XX:XX:XX`

غيّر رابط زر Login في `login.html` إلى:

```
https://www.example.com/register.html?mac=$(mac)

```

(صحّح الرابط ليشير إلى خادمك)

- لإظهار banner بعد login، في `alogin.html` بعد

`$(if popup == 'true')` أضف السطر التالي:

```
open('http://www.example.com/your-banner-page.html', 'my-banner-name','');

```

(صحّح الرابط ليشير إلى الصفحة التي تريد عرضها)

- لاختيار صفحة مختلفة بعد login، في `login.html` غيّر:

```
<input type="hidden" name="dst" value="$(link-orig)">

```

إلى هذا السطر:

```
<input type="hidden" name="dst" value="http://www.example.com">

```

(صحّح الرابط ليشير إلى خادمك)

- لمسح cookie عند تسجيل الخروج، في الصفحة التي تحتوي رابطًا إلى logout (مثلًا في `status.html`) غيّر:

```
open('$(link-logout)', 'hotspot_logout', ...

```

إلى:

```
open('$(link-logout)?erase-cookie=on', 'hotspot_logout', ...

```

أو بدلًا من ذلك أضف هذا السطر:

```
<input type="hidden" name="erase-cookie" value="on">

```

قبل هذا السطر:

```
<input type="submit" value="log off">

```

#### مصادقة خارجية (External authentication)

مثال آخر: جعل HotSpot يُجري authentication عبر خادم بعيد (قد ينفّذ مثلًا charge لبطاقات ائتمان):

- اسمح بالوصول المباشر إلى الخادم الخارجي في walled-garden (سواء القائم على HTTP أو على IP)
- عدّل صفحة login لـ HotSpot servlet لتعيد التوجيه إلى خادم authentication الخارجي. يجب أن يعدّل الخادم الخارجي قاعدة بيانات RADIUS حسب الحاجة

مثال لصفحة login كهذه تُوضع على HotSpot router (تعيد التوجيه إلى `https://auth.example.com/login.php`؛ استبدلها بعنوان خادم authentication الخارجي الفعلي):

```
<html>
<title>...</title>
<body>
<form name="redirect" action="https://auth.example.com/login.php" method="post">
<input type="hidden" name="mac" value="$(mac)">
<input type="hidden" name="ip" value="$(ip)">
<input type="hidden" name="username" value="$(username)">
<input type="hidden" name="link-login" value="$(link-login)">
<input type="hidden" name="link-orig" value="$(link-orig)">
<input type="hidden" name="error" value="$(error)">
</form>
<script language="JavaScript">
<!--
	document.redirect.submit();
//-->
</script>
</body>
</html>
          

```

- يمكن للخادم الخارجي تسجيل دخول HotSpot client بإعادته إلى صفحة login الأصلية لـ HotSpot servlet مع تحديد username و password الصحيحين

مثال لصفحة كهذه (تعيد التوجيه إلى `https://hotspot.example.com/login`؛ استبدلها بعنوان HotSpot router الفعلي؛ وتعرض `www.mikrotik.com` بعد نجاح login، فاستبدلها بما تحتاج):

```
<html>
<title>Hotspot login page</title>
<body>
<form name="login" action="https://hotspot.example.com/login" method="post">
<input type="text" name="username" value="demo">
<input type="password" name="password" value="none">
<input type="hidden" name="domain" value="">
<input type="hidden" name="dst" value="http://www.mikrotik.com/">
<input type="submit" name="login" value="log in">
</form>
</body>
</html>
          

```

- سيسأل HotSpot خادم RADIUS هل يُسمح بالـ login أم لا. إن سُمح، تُعرض صفحة `alogin.html` (ويمكن تعديلها لفعل أي شيء). وإن لم يُسمَح، تُعرض `flogin.html` (أو `login.html`) التي ستعيد توجيه الـ client إلى خادم authentication الخارجي.

ملاحظة: كما في هذه الأمثلة، يمكن استخدام بروتوكول HTTPS وطريقة POST لتأمين الاتصالات.

#### اكتشاف HTTP header (HTTP header detection)

صفحات HotSpot login يمكنها الوصول إلى HTTP headers عبر `$(http-header-name)`.

مثلًا، يمكن فحص user agent (أو المتصفح) وإرجاع محتوى مختلف بدل صفحة login العادية إن رغبت. يمكن استخدام ذلك لتعطيل النوافذ المنبثقة التلقائية على الهواتف مثلًا.

مثال: لإخراج `"SUCCESS"` لمستخدمي نسخة معيّنة من Firefox mobile بدل صفحة login، ضع هذه الأسطر في أعلى صفحة `rlogin.html` داخل مجلد hotspot:

```
$(if user-agent == "Mozilla/5.0 (Android; Mobile; rv:40.0) Gecko/40.0 Firefox/40.0" ) 
<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML> 
$(else)
---- regular content of rlogin.html page  ----
$(endif)

```

هذا سيعطّل login popup لمستخدمي Android Firefox 40.

#### تسجيل دخول بنقرة واحدة (One-click login)

يمكن إنشاء captive portal معدَّل لتسجيل دخول سريع بنقرة واحدة في السيناريوهات التي لا تتطلب user أو password.

ما تحتاج فعله:

- أنشئ مستخدمًا لهذا الغرض. في المثال: `"notsosecretuser"` بكلمة مرور `"notsosecretpass"`
- اربط هذا المستخدم بـ user profile يسمح بعدد محدد/غير محدود من المستخدمين النشطين المتزامنين.
- انسخ مجلد hotspot الأصلي المُولَّد مسبقًا في قائمة ملفات الموجّه على المستوى الجذري.
- عدّل محتويات نسخة هذا المجلد.

- ملف واحد فقط يحتاج تعديلًا ليعمل هذا: `"login.html"`.

الأصلي:

```
<table width="100" style="background-color: #ffffff">
  <tr><td align="right">login</td>
      <td><input style="width: 80px" name="username" type="text" value="$(username)"/></td>
  </tr>
  <tr><td align="right">password</td>
      <td><input style="width: 80px" name="password" type="password"/></td>
  </tr>
  <tr><td> </td>
      <td><input type="submit" value="OK" /></td>
  </tr>
</table>

```

بعد التعديل:

```
<table width="100" style="background-color: #ffffff">
  <tr style="display:none;"><td align="right">login</td>
    <td><input style="width: 80px" name="username" type="text" value="notsosecretuser"/></td>
  </tr>
  <tr style="display:none;"><td align="right">password</td>
    <td><input style="width: 80px" name="password" type="password" value="notsosecretpass"/></td>
  </tr>
  <tr><td> </td>
    <td><input type="submit" value="Proceed to Internet!" /></td>
  </tr>
</table>

```

ما الذي تغيّر:

- حقول User و Password أصبحت مخفية.
- قيمتا حقلي User و Password تحتويان قيمًا جاهزة مسبقًا.
- تغيّرت قيمة (اسم) زر `"OK"` إلى نص أنسب.

- ارفع مجلد hotspot الجديد هذا إلى الموجّه، يُفضَّل باسم مختلف.
- غيّر الإعدادات في hotspot server profile لاستخدام مجلد html الجديد.

```
/ip hotspot profile set (profile number or name) html-directory-override=(dir path/name)

```

### ملخص (Summary)

إلى جانب العناصر الديناميكية الواضحة في القائمة الفرعية `/ip hotspot` نفسها (مثل hosts والمستخدمين النشطين)، تُضاف بعض القواعد الإضافية في جداول firewall عند تفعيل خدمة HotSpot.

### NAT

من أمر `/ip firewall nat print dynamic` قد ترى شيئًا مثل التالي (التعليقات بعد كل قاعدة):

```
 0 D chain=dstnat action=jump jump-target=hotspot hotspot=from-client

```

وضع كل مهام HotSpot المتعلقة بالحزم القادمة من جميع HotSpot clients في chain منفصلة.

```
 1 I chain=hotspot action=jump jump-target=pre-hotspot

```

أي إجراءات يجب تنفيذها قبل تطبيق قواعد HotSpot تُوضَع في chain `pre-hotspot`. هذه الـ chain تحت سيطرة المسؤول بالكامل ولا تحتوي قواعد يضعها النظام؛ لذا تظهر قاعدة jump غير صالحة (لأن الـ chain فارغة افتراضيًا).

```
 2 D chain=hotspot action=redirect to-ports=64872 dst-port=53 protocol=udp 
 3 D chain=hotspot action=redirect to-ports=64872 dst-port=53 protocol=tcp 

```

إعادة توجيه كل طلبات DNS إلى خدمة HotSpot. المنفذ 64872 يوفّر خدمة DNS لجميع مستخدمي HotSpot. إذا أردت أن يستمع HotSpot server إلى منفذ آخر، أضف قواعد هنا بنفس الأسلوب مع تغيير الخاصية `dst-port`.

```
 4 D chain=hotspot action=redirect to-ports=64873 hotspot=local-dst dst-port=80
     protocol=tcp

```

إعادة توجيه كل طلبات HTTP login إلى HTTP login servlet. المنفذ 64873 هو منفذ HotSpot HTTP servlet.

```
 5 D chain=hotspot action=redirect to-ports=64875 hotspot=local-dst dst-port=443
     protocol=tcp

```

إعادة توجيه كل طلبات HTTPS login إلى HTTPS login servlet. المنفذ 64875 هو منفذ HotSpot HTTPS servlet.

```
 6 D chain=hotspot action=jump jump-target=hs-unauth hotspot=!auth protocol=tcp

```

كل الحزم الأخرى باستثناء طلبات DNS و login من clients غير مصرّح لهم يجب أن تمر عبر chain `hs-unauth`.

```
 7 D chain=hotspot action=jump jump-target=hs-auth hotspot=auth protocol=tcp

```

وحزم clients المصرّح لهم — عبر chain `hs-auth`.

```
 8 D ;;; www.mikrotik.com
     chain=hs-unauth action=return dst-address=66.228.113.26 dst-port=80 protocol=tcp

```

أول ما يُوضَع في chain `hs-unauth` هو كل ما يؤثر على بروتوكول TCP في القائمة الفرعية `/ip hotspot walled-garden ip` (أي كل ما لم يُضبط فيه protocol أو ضُبط على TCP). هنا نستثني `www.mikrotik.com` من إعادة التوجيه إلى login page.

```
 9 D chain=hs-unauth action=redirect to-ports=64874 dst-port=80 protocol=tcp

```

كل طلبات HTTP الأخرى تُعاد توجيهها إلى خادم Walled Garden proxy الذي يستمع على المنفذ 64874. إذا وُجد إدخال `"allow"` في قائمة `/ip hotspot walled-garden` لطلب HTTP، يُمرَّر إلى الوجهة. وإلا يُعاد توجيه الطلب تلقائيًا إلى HotSpot login servlet (المنفذ 64873).

```
10 D chain=hs-unauth action=redirect to-ports=64874 dst-port=3128 protocol=tcp 
11 D chain=hs-unauth action=redirect to-ports=64874 dst-port=8080 protocol=tcp 

```

يفترض HotSpot افتراضيًا أن هذه المنافذ فقط قد تُستخدم لطلبات HTTP proxy. هذان الإدخالان يستخدمان "التقاط" طلبات الـ client إلى proxies غير معروفة (يمكنك إضافة قواعد أخرى هنا لمنافذ إضافية). أي لتمكين العملاء ذوي إعدادات proxy غير معروفة من العمل مع نظام HotSpot. تُسمّى هذه الميزة `"Universal Proxy"`. إذا اكتُشف أن الـ client يستخدم proxy server معيّنًا، سيضع النظام تلقائيًا علامة HTTP hotspot mark على تلك الحزم لتجاوز مشكلة الـ proxy غير المعروف، كما سنرى لاحقًا. لاحظ أن المنفذ المستخدم (64874) هو نفسه المستخدم لطلبات HTTP في القاعدة #9 (لذا تُعالَج طلبات HTTP و HTTP proxy بنفس الكود).

```
12 D chain=hs-unauth action=redirect to-ports=64875 dst-port=443 protocol=tcp

```

HTTPS proxy يستمع على المنفذ 64875.

```
13 I chain=hs-unauth action=jump jump-target=hs-smtp dst-port=25 protocol=tcp

```

يمكن أيضًا تعريف إعادة توجيه لبروتوكول SMTP في إعدادات HotSpot. إن وُجدت، تُوضَع قاعدة redirect في chain `hs-smtp`. الهدف تمكين المستخدمين ذوي إعدادات SMTP غير معروفة من إرسال بريدهم عبر SMTP server لمزوّد الخدمة (خاصتك) بدلًا من الذهاب إلى SMTP server الذي ضبطوه على أجهزتهم [والذي قد يكون غير متاح خارج شبكة أصلهم]. الـ chain فارغة افتراضيًا؛ لذا تظهر قاعدة jump غير صالحة.

```
14 D chain=hs-auth action=redirect to-ports=64874 hotspot=http protocol=tcp

```

توفير خدمة HTTP proxy للمستخدمين المصرّح لهم. قد تحتاج طلبات المستخدمين المصادَق عليهم إلى transparent proxying (تقنية `"Universal Proxy"` وميزة advertisement). تُوضَع علامة HTTP هذه تلقائيًا على طلبات HTTP proxy إلى الخوادم التي يكتشفها HotSpot HTTP proxy (المستمع على المنفذ 64874) كطلبات HTTP proxy لخوادم proxy غير معروفة. الهدف أن يستخدم المستخدمون الذين لديهم إعدادات proxy معيّنة بوابة HotSpot بدلًا من خادم الـ proxy المضبوط على أجهزتهم [والذي قد يكون غير متاح خارج شبكة أصلهم]. تُطبَّق هذه العلامة أيضًا عندما يحين عرض advertisement للمستخدم، وكذلك على أي طلبات HTTP من مستخدمين ملفهم الشخصي مضبوط لعمل transparent proxy لطلباتهم.

```
15 I chain=hs-auth action=jump jump-target=hs-smtp dst-port=25 protocol=tcp

```

توفير SMTP proxy للمستخدمين المصرّح لهم (نفس فكرة القاعدة #13).

### تصفية الحزم (Packet Filtering)

من أمر `/ip firewall filter print dynamic` قد ترى شيئًا مثل التالي (التعليقات بعد كل قاعدة):

```
 0 D chain=forward action=jump jump-target=hs-unauth hotspot=from-client,!auth

```

أي حزمة تعبر الموجّه من client غير مصرّح له تُرسَل إلى chain `hs-unauth`. وتنفّذ `hs-unauth` مرشّح Walled Garden القائم على IP.

```
 1 D chain=forward action=jump jump-target=hs-unauth-to hotspot=to-client,!auth

```

كل ما يصل إلى العملاء عبر الموجّه يُعاد توجيهه إلى chain أخرى اسمها `hs-unauth-to`. يجب أن ترفض هذه الـ chain الطلبات غير المصرّح بها نحو العملاء.

```
 2 D chain=input action=jump jump-target=hs-input hotspot=from-client

```

كل ما يأتي من العملاء إلى الموجّه نفسه يصل إلى chain أخرى اسمها `hs-input`.

```
 3 I chain=hs-input action=jump jump-target=pre-hs-input

```

قبل المتابعة مع القواعد الديناميكية [المعرّفة مسبقًا]، تصل الحزمة إلى chain خاضعة لإدارة المسؤول اسمها `pre-hs-input`، وهي فارغة افتراضيًا؛ لذا تكون قاعدة jump في حالة غير صالحة.

```
 4 D chain=hs-input action=accept dst-port=64872 protocol=udp 
 5 D chain=hs-input action=accept dst-port=64872-64875 protocol=tcp 

```

السماح للـ client بالوصول إلى خدمات authentication و proxy المحلية (كما وُصف سابقًا).

```
 6 D chain=hs-input action=jump jump-target=hs-unauth hotspot=!auth

```

كل حركة المرور الأخرى من clients غير مصرّح لهم إلى الموجّه نفسه تُعامَل بنفس طريقة الحركة العابرة للموجّهات.

```
 7 D chain=hs-unauth action=return protocol=icmp
 8 D ;;; www.mikrotik.com
     chain=hs-unauth action=return dst-address=66.228.113.26 dst-port=80 protocol=tcp

```

بخلاف جدول NAT حيث أُضيفت فقط إدخالات Walled Garden المتعلقة ببروتوكول TCP، في مرشّح الحزم تُضاف إلى chain `hs-unauth` كل ما ضبطته في قائمة `/ip hotspot walled-garden ip`. لذلك رغم أنك رأيت إدخالًا واحدًا فقط في جدول NAT، توجد هنا قاعدتان.

```
 9 D chain=hs-unauth action=reject reject-with=tcp-reset protocol=tcp
10 D chain=hs-unauth action=reject reject-with=icmp-net-prohibited

```

كل ما لم يُدرَج في القائمة البيضاء عبر Walled Garden سيُرفَض. لاحظ استخدام TCP Reset لرفض اتصالات TCP.

```
11 D chain=hs-unauth-to action=return protocol=icmp
12 D ;;; www.mikrotik.com
     chain=hs-unauth-to action=return src-address=66.228.113.26 src-port=80 protocol=tcp

```

نفس الإجراء كما في القاعدتين #7 و #8 يُنفَّذ أيضًا للحزم المتجهة إلى العملاء (chain `hs-unauth-to`).

```
13 D chain=hs-unauth-to action=reject reject-with=icmp-host-prohibited

```

رفض كل الحزم المتجهة إلى العملاء برسالة ICMP reject.
