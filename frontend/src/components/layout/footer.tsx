import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cooperativa</h3>
            <p className="text-sm text-muted-foreground">
              Tu tienda de confianza para productos de calidad a precios
              justos.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Enlaces</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/products"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Productos
              </Link>
              <Link
                href="/cart"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Carrito
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Contacto</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Email: info@cooperativa.com</p>
              <p>Tel: +58 412 1234567</p>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Horario</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Lun - Vie: 8:00 AM - 6:00 PM</p>
              <p>Sáb: 9:00 AM - 4:00 PM</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Cooperativa. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  );
}
