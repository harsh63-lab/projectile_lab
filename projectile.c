/* Projectile motion solver in C.
 * Build:  gcc projectile.c -o projectile -lm
 * Run:    ./projectile [v0 theta_deg h0 g [drag m diameter cd rho]]
 * e.g.    ./projectile 22 35 0 9.81 1 0.43 0.22 0.25 1.225
 */
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#define PI 3.14159265358979323846

static void acc(double k, double g, double ux, double uy, double *ax, double *ay) {
    double s = sqrt(ux * ux + uy * uy);
    *ax = -k * s * ux;
    *ay = -g - k * s * uy;
}

int main(int argc, char **argv) {
    double v0 = argc > 1 ? atof(argv[1]) : 30.0;
    double ang = argc > 2 ? atof(argv[2]) : 45.0;
    double h0 = argc > 3 ? atof(argv[3]) : 0.0;
    double g = argc > 4 ? atof(argv[4]) : 9.81;
    int drag = argc > 5 ? atoi(argv[5]) : 0;
    double m = argc > 6 ? atof(argv[6]) : 0.43;
    double d = argc > 7 ? atof(argv[7]) : 0.22;
    double cd = argc > 8 ? atof(argv[8]) : 0.25;
    double rho = argc > 9 ? atof(argv[9]) : 1.225;

    double th = ang * PI / 180.0;
    double vx = v0 * cos(th), vy = v0 * sin(th);
    double T = (vy + sqrt(vy * vy + 2 * g * h0)) / g;
    double R = vx * T, H = h0 + vy * vy / (2 * g);
    double vimp = hypot(vx, vy - g * T);
    double aimp = atan2(fabs(vy - g * T), vx) * 180.0 / PI;

    printf("Launch: v0=%g m/s, theta=%g deg, h0=%g m, g=%g m/s^2\n", v0, ang, h0, g);
    printf("vx=%.3f m/s  vy=%.3f m/s\n\n", vx, vy);

    double t = 0, x = 0, y = h0, ux = vx, uy = vy, Hd = h0, dt = 0.001, k = 0;
    if (drag) {
        k = 0.5 * rho * cd * PI * d * d / 4.0 / m;
        while (t < 900) {
            double a1x, a1y, a2x, a2y, a3x, a3y, a4x, a4y;
            acc(k, g, ux, uy, &a1x, &a1y);
            acc(k, g, ux + 0.5 * dt * a1x, uy + 0.5 * dt * a1y, &a2x, &a2y);
            acc(k, g, ux + 0.5 * dt * a2x, uy + 0.5 * dt * a2y, &a3x, &a3y);
            acc(k, g, ux + dt * a3x, uy + dt * a3y, &a4x, &a4y);
            double xn = x + dt / 6 * (ux + 2 * (ux + 0.5 * dt * a1x) + 2 * (ux + 0.5 * dt * a2x) + (ux + dt * a3x));
            double yn = y + dt / 6 * (uy + 2 * (uy + 0.5 * dt * a1y) + 2 * (uy + 0.5 * dt * a2y) + (uy + dt * a3y));
            double uxn = ux + dt / 6 * (a1x + 2 * a2x + 2 * a3x + a4x);
            double uyn = uy + dt / 6 * (a1y + 2 * a2y + 2 * a3y + a4y);
            if (yn < 0) {
                double f = y / (y - yn);
                x += f * (xn - x); ux += f * (uxn - ux); uy += f * (uyn - uy);
                t += f * dt; y = 0;
                break;
            }
            x = xn; y = yn; ux = uxn; uy = uyn; t += dt;
            if (y > Hd) Hd = y;
        }
        printf("Drag constant k = %.5f 1/m\n", k);
    }

    printf("%-24s%12s%s\n", "", "Ideal", drag ? "   With drag" : "");
    printf("%-24s%12.3f", "Time of flight (s)", T);       if (drag) printf("%12.3f", t);  printf("\n");
    printf("%-24s%12.3f", "Range (m)", R);                if (drag) printf("%12.3f", x);  printf("\n");
    printf("%-24s%12.3f", "Max height (m)", H);           if (drag) printf("%12.3f", Hd); printf("\n");
    printf("%-24s%12.3f", "Impact speed (m/s)", vimp);    if (drag) printf("%12.3f", hypot(ux, uy)); printf("\n");
    printf("%-24s%12.2f", "Impact angle (deg)", aimp);    if (drag) printf("%12.2f", atan2(fabs(uy), fabs(ux)) * 180.0 / PI); printf("\n");
    return 0;
}
