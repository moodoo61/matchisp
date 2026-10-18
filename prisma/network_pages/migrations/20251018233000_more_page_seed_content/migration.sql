-- Seed محتوى صفحة المزيد من النموذج المرجعي (مرة واحدة إن كانت الجداول فارغة)

-- عناصر التبويب
INSERT INTO "more_page_items" ("id", "name", "imageUrl", "description", "instructions", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT * FROM (VALUES
  (
    'a1000001-0000-4000-8000-000000000001'::uuid,
    'البث المباشر',
    '/api/uploads/more-page/live_sport.jpg',
    'استمتع ببث مباشر عالي الجودة لمشاهدة القنوات الرياضية والترفيهية. للدخول للخدمة اضغط على التعليمات',
    '["بعد تسجيل الدخول قم بفتح المتصفح والدخول لهذا الرابط http://a.com","قم بالضغط على أيقونة البث المباشر لتظهر معك صفحة البث المباشر","قم بالضغط على أحد القنوات لتشغيلها"]'::jsonb,
    0,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a1000001-0000-4000-8000-000000000002'::uuid,
    'الاستراحة',
    '/api/uploads/more-page/msdia.jpg',
    'استراحة حصرية لمشاهدة المحتوى الترفيهي والفني. للدخول للخدمة اضغط على التعليمات',
    '["بعد تسجيل الدخول قم بفتح المتصفح والدخول لهذا الرابط http://a.com","يمكن من هنا الدخول للخدمة قم بالنقر على أيقونة الاستراحة","بعدها قم بالنقر على الصورة لدخول واستعرض المحتوى"]'::jsonb,
    1,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a1000001-0000-4000-8000-000000000003'::uuid,
    'المحتوى التعليمي والثقافي',
    '/api/uploads/more-page/ed.jpg',
    E'نحن نؤمن أن بناء المجتمع يبدأ من الأسرة الواعية، وأن المعرفة هي الأساس لكل نهضة حقيقية.\nلذلك نضع المحتوى التعليمي والثقافي في مقدمة أولوياتنا، ونسعى لتقديم مواد تثري الفكر، وتدعم التربية السليمة، وتعزز القيم الإنسانية والإسلامية الوسطية.\nمعًا نرتقي بالوعي، ونبني جيلًا يفهم الحياة بعلم، ويعيشها بأخلاق',
    NULL,
    2,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a1000001-0000-4000-8000-000000000004'::uuid,
    'إنترنت فائق السرعة',
    '/api/uploads/more-page/speed.jpg',
    E'اتصال إنترنت سريع وموثوق يوفر لك تجربة تصفح وبث ممتازة.\nنقدّم خدمة إنترنت نابعة من إمكاناتنا الحقيقية، نطوّرها باستمرار ونديرها بعناية، لنضمن تجربة تصفح وبث مستقرة قدر المستطاع.\nنعمل على تحسين موارد الشبكة خطوة بخطوة، ونوازن بين الجودة والاستدامة، لأننا نؤمن أن الصدق في الخدمة هو أساس الثقة',
    NULL,
    3,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a1000001-0000-4000-8000-000000000005'::uuid,
    'أمان وحماية',
    '/api/uploads/more-page/safe.jpg',
    E'نؤمن أن الإنترنت يجب أن يكون وسيلة معرفة لا مصدر قلق،\nلذلك نسعى جاهدين إلى حماية الأسرة، وتنقية المحتوى، وتوفير تجربة استخدام آمنة تحترم القيم وتراعي الأبناء.',
    NULL,
    4,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
) AS v("id", "name", "imageUrl", "description", "instructions", "sortOrder", "isActive", "createdAt", "updatedAt")
WHERE NOT EXISTS (SELECT 1 FROM "more_page_items" LIMIT 1);

-- بطاقات من نحن
INSERT INTO "more_page_about_cards" ("id", "title", "body", "iconKey", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT * FROM (VALUES
  (
    'a2000001-0000-4000-8000-000000000001'::uuid,
    'رؤيتنا',
    E'نطمح في ماتش لينك أن نكون النموذج الرائد للاتصال الذكي في مأرب،\nحيث تلتقي القيم الأصيلة بالتقنية الحديثة،\nونوفّر لكل بيت إنترنت موثوقًا، آمنًا، وعالي الجودة،\nيسهم في تمكين الأسرة، ودعم التعليم، وتحفيز التنمية،\nلتكون مأرب أكثر اتصالًا… وأكثر ازدهارًا.',
    'vision',
    0,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a2000001-0000-4000-8000-000000000002'::uuid,
    'مهمتنا',
    'واقع صعب، واجتهاد مستمر، وخدمة نحترم بها عملاءنا.',
    'mission',
    1,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a2000001-0000-4000-8000-000000000003'::uuid,
    'قيمنا',
    'الشفافية والموثوقية والالتزام بجودة الخدمة هي أساس عملنا. نحن ملتزمون بتقديم أفضل تجربة ممكنة لعملائنا مع المحتوى التعليمي والثقافي ومحترف.',
    'values',
    2,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
) AS v("id", "title", "body", "iconKey", "sortOrder", "isActive", "createdAt", "updatedAt")
WHERE NOT EXISTS (SELECT 1 FROM "more_page_about_cards" LIMIT 1);

-- مقاطع القصة
INSERT INTO "more_page_story_blocks" ("id", "title", "body", "imageUrl", "variant", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT * FROM (VALUES
  (
    'a3000001-0000-4000-8000-000000000001'::uuid,
    NULL::text,
    E'في مكانٍ كان الوصول فيه صعبًا،\nوكان الانتظار أطول من الإشارة…\nوُلدت فكرة ماتش لينك.\n\nلم تكن شبكة،\nكانت محاولة نجاة.\n\nمحاولة لأن يبقى الناس على تواصل،\nلأن يتعلّم طفل،\nويعمل شاب،\nويطمئن قلب.',
    '/api/uploads/more-page/story1.jpg',
    'intro',
    0,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a3000001-0000-4000-8000-000000000002'::uuid,
    'بدأنا من الصفر…',
    E'من أسلاكٍ تُجرب،\nوأجهزةٍ تُعاد تهيئتها،\nوأخطاءٍ علّمتنا أكثر مما أتعبتنا.\n\nكل انقطاعٍ زادنا عنادًا،\nوكل فشلٍ صنع خبرة،\nوكل نجاحٍ صغير…\nكان وعدًا أن القادم أفضل.',
    '/api/uploads/more-page/story2.jpg',
    'section',
    1,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a3000001-0000-4000-8000-000000000003'::uuid,
    'من سبأ،',
    E'حيث لا يُقاس المجد بالكلام،\nبل بالصبر والعمل،\nحملنا روح الحضارة القديمة\nوبنينا بها اتصالًا حديثًا.',
    '/api/uploads/more-page/story3.jpg',
    'section',
    2,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a3000001-0000-4000-8000-000000000004'::uuid,
    'تميّزنا لأننا:',
    E'لا نبيع وهم\nبل نزرع ثقة.\n\nولا نقدّم خدمة،\nبل نحمل مسؤولية.',
    '/api/uploads/more-page/story4.jpg',
    'highlight',
    3,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'a3000001-0000-4000-8000-000000000005'::uuid,
    'ماتش لينك',
    E'ليست الأقوى صدفة…\nبل الأقوى لأنها وُلدت من المعاناة،\nواستمرّت بالإصرار،\nووصلت بالناس…\nقبل أن تصل بالإنترنت.',
    '/api/uploads/more-page/story5.jpg',
    'conclusion',
    4,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
) AS v("id", "title", "body", "imageUrl", "variant", "sortOrder", "isActive", "createdAt", "updatedAt")
WHERE NOT EXISTS (SELECT 1 FROM "more_page_story_blocks" LIMIT 1);
