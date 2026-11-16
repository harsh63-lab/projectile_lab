/**
 * Projectile motion solver in Java.
 * Build:  javac Projectile.java
 * Run:    java Projectile [v0 theta_deg h0 g [drag m diameter cd rho]]
 * e.g.    java Projectile 22 35 0 9.81 1 0.43 0.22 0.25 1.225
 */
public class Projectile {
    static double k, g;

    static double[] acc(double ux, double uy) {
        double s = Math.hypot(ux, uy);
        return new double[] { -k * s * ux, -g - k * s * uy };
    }

    static double arg(String[] a, int i, double def) {
        return a.length > i ? Double.parseDouble(a[i]) : def;
    }

    public static void main(String[] a) {
        double v0 = arg(a, 0, 30), ang = arg(a, 1, 45), h0 = arg(a, 2, 0);
        g = arg(a, 3, 9.81);
        boolean drag = arg(a, 4, 0) != 0;
        double m = arg(a, 5, 0.43), d = arg(a, 6, 0.22), cd = arg(a, 7, 0.25), rho = arg(a, 8, 1.225);

        double th = Math.toRadians(ang);
        double vx = v0 * Math.cos(th), vy = v0 * Math.sin(th);
        double T = (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;
        double R = vx * T, H = h0 + vy * vy / (2 * g);
        double vimp = Math.hypot(vx, vy - g * T);
        double aimp = Math.toDegrees(Math.atan2(Math.abs(vy - g * T), vx));

        System.out.printf("Launch: v0=%s m/s, theta=%s deg, h0=%s m, g=%s m/s^2%n", v0, ang, h0, g);
        System.out.printf("vx=%.3f m/s  vy=%.3f m/s%n%n", vx, vy);

        double t = 0, x = 0, y = h0, ux = vx, uy = vy, Hd = h0, dt = 0.001;
        if (drag) {
            k = 0.5 * rho * cd * Math.PI * d * d / 4.0 / m;
            while (t < 900) {
                double[] a1 = acc(ux, uy);
                double[] a2 = acc(ux + 0.5 * dt * a1[0], uy + 0.5 * dt * a1[1]);
                double[] a3 = acc(ux + 0.5 * dt * a2[0], uy + 0.5 * dt * a2[1]);
                double[] a4 = acc(ux + dt * a3[0], uy + dt * a3[1]);
                double xn = x + dt / 6 * (ux + 2 * (ux + 0.5 * dt * a1[0]) + 2 * (ux + 0.5 * dt * a2[0]) + (ux + dt * a3[0]));
                double yn = y + dt / 6 * (uy + 2 * (uy + 0.5 * dt * a1[1]) + 2 * (uy + 0.5 * dt * a2[1]) + (uy + dt * a3[1]));
                double uxn = ux + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
                double uyn = uy + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
                if (yn < 0) {
                    double f = y / (y - yn);
                    x += f * (xn - x); ux += f * (uxn - ux); uy += f * (uyn - uy);
                    t += f * dt; y = 0;
                    break;
                }
                x = xn; y = yn; ux = uxn; uy = uyn; t += dt;
                if (y > Hd) Hd = y;
            }
            System.out.printf("Drag constant k = %.5f 1/m%n", k);
        }

        System.out.printf("%-24s%12s%s%n", "", "Ideal", drag ? "   With drag" : "");
        row("Time of flight (s)", T, t, drag, 3);
        row("Range (m)", R, x, drag, 3);
        row("Max height (m)", H, Hd, drag, 3);
        row("Impact speed (m/s)", vimp, Math.hypot(ux, uy), drag, 3);
        row("Impact angle (deg)", aimp, Math.toDegrees(Math.atan2(Math.abs(uy), Math.abs(ux))), drag, 2);
    }

    static void row(String label, double ideal, double dragVal, boolean drag, int nd) {
        String f = "%12." + nd + "f";
        System.out.printf("%-24s" + f, label, ideal);
        if (drag) System.out.printf(f, dragVal);
        System.out.println();
    }
}
