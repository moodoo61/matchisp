#define _GNU_SOURCE
#include <dlfcn.h>

typedef struct ssl_ctx_st SSL_CTX;
typedef int (*set_cipher_fn)(SSL_CTX *, const char *);

/*
 * sstpc يفرض !aNULL بينما MikroTik مع certificate=none يتفاوض ADH فقط.
 * بعد تثبيت شهادة على الراوتر يُفضَّل AES256-SHA / AES256-GCM-SHA384.
 */
int SSL_CTX_set_cipher_list(SSL_CTX *ctx, const char *str) {
  static set_cipher_fn real_fn = 0;
  (void)str;
  if (!real_fn) {
    real_fn = (set_cipher_fn)dlsym(RTLD_NEXT, "SSL_CTX_set_cipher_list");
  }
  if (!real_fn) {
    return 0;
  }
  return real_fn(
      ctx,
      "AES256-SHA:AES256-GCM-SHA384:AES128-SHA:ADH-AES256-SHA:ALL:@SECLEVEL=0");
}
