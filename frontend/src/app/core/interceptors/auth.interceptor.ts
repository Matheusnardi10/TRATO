import { HttpInterceptorFn } from '@angular/common/http';

/* Interceptor simples: hoje o login é básico (sem JWT) para manter o nível
   de complexidade pedido no projeto, então este interceptor só existe como
   ponto único de extensão — se um dia o backend passar a exigir um token,
   basta acrescentar o header aqui, sem mexer em cada service. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const usuarioBruto = localStorage.getItem('trato.sessao.usuario');
  if (!usuarioBruto) return next(req);
  const usuario = JSON.parse(usuarioBruto);
  const clonado = req.clone({ setHeaders: { 'X-Usuario-Id': String(usuario.id ?? '') } });
  return next(clonado);
};
