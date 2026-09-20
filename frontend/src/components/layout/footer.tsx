import Link from "next/link";
import Image from "next/image";
import { Globe, MessageCircle, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/logo_coop5deJulio.png"
                alt="Cooperativa 5 de Julio"
                width={48}
                height={48}
                className="rounded-full"
              />
              <span className="text-lg font-bold">Cooperativa 5 de Julio</span>
            </Link>
            <p className="text-sm text-gray-400">
              56 años Construyendo Comunidad.
            </p>
            {/* Social Media */}
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <Globe className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Globe className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/584121234567"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-green-500 flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Tienda */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Tienda</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/products"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Productos
              </Link>
              <Link
                href="/favorites"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Favoritos
              </Link>
              <Link
                href="/orders"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Mis órdenes
              </Link>
              <Link
                href="/cart"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Carrito
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Contacto</h4>
            <div className="text-sm text-gray-400 space-y-2">
              <p>info@cooperativa.com</p>
              <p>+58 412 1234567</p>
              <p>Caracas, Venezuela</p>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Horario</h4>
            <div className="text-sm text-gray-400 space-y-2">
              <p>Lun - Vie: 8:00 AM - 6:00 PM</p>
              <p>Sáb: 9:00 AM - 4:00 PM</p>
              <p>Dom: Cerrado</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Cooperativa 5 de Julio R.L. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white transition-colors">
              Términos
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}