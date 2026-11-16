#!/usr/bin/env python3
"""Projectile motion solver (Engineering Mechanics, kinematics of a particle).

Examples
  python3 projectile.py                          # v0=30 m/s, 45 deg, h0=0
  python3 projectile.py -v 22 -a 35 --drag       # add quadratic air drag
  python3 projectile.py -v 25 --target 40 5      # angles that hit x=40 m, y=5 m
  python3 projectile.py -v 30 -a 45 --csv path.csv
"""
import argparse
import math


def ideal(v0, theta_deg, h0=0.0, g=9.81):
    th = math.radians(theta_deg)
    vx, vy = v0 * math.cos(th), v0 * math.sin(th)
    T = (vy + math.sqrt(vy * vy + 2 * g * h0)) / g
    return {
        "vx": vx, "vy": vy, "T": T, "R": vx * T,
        "H": h0 + vy * vy / (2 * g),
        "v_impact": math.hypot(vx, vy - g * T),
        "angle_impact": math.degrees(math.atan2(abs(vy - g * T), vx)),
    }


def with_drag(v0, theta_deg, h0=0.0, g=9.81, m=0.43, d=0.22, cd=0.25, rho=1.225, dt=0.001):
    """RK4 integration of a = -k|v|v - g j, with k = 0.5*rho*Cd*A/m."""
    k = 0.5 * rho * cd * math.pi * d * d / 4 / m
    th = math.radians(theta_deg)
    x, y, ux, uy, t = 0.0, h0, v0 * math.cos(th), v0 * math.sin(th), 0.0
    H = h0
    path = [(0.0, x, y)]

    def acc(ux, uy):
        s = math.hypot(ux, uy)
        return -k * s * ux, -g - k * s * uy

    while t < 900:
        a1 = acc(ux, uy)
        a2 = acc(ux + 0.5 * dt * a1[0], uy + 0.5 * dt * a1[1])
        a3 = acc(ux + 0.5 * dt * a2[0], uy + 0.5 * dt * a2[1])
        a4 = acc(ux + dt * a3[0], uy + dt * a3[1])
        xn = x + dt / 6 * (ux + 2 * (ux + 0.5 * dt * a1[0]) + 2 * (ux + 0.5 * dt * a2[0]) + (ux + dt * a3[0]))
        yn = y + dt / 6 * (uy + 2 * (uy + 0.5 * dt * a1[1]) + 2 * (uy + 0.5 * dt * a2[1]) + (uy + dt * a3[1]))
        uxn = ux + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0])
        uyn = uy + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1])
        if yn < 0:  # linear interpolation to y = 0
            f = y / (y - yn)
            x += f * (xn - x)
            ux += f * (uxn - ux)
            uy += f * (uyn - uy)
            t += f * dt
            y = 0.0
            path.append((t, x, y))
            break
        x, y, ux, uy, t = xn, yn, uxn, uyn, t + dt
        H = max(H, y)
        path.append((t, x, y))
    return {
        "T": t, "R": x, "H": H, "v_impact": math.hypot(ux, uy),
        "angle_impact": math.degrees(math.atan2(abs(uy), abs(ux))), "k": k, "path": path,
    }


def angles_to_hit(v0, X, Y, g=9.81):
    """Launch angles (deg) that pass through (X, Y) from the origin, no drag."""
    disc = v0 ** 4 - g * (g * X * X + 2 * Y * v0 * v0)
    if disc < 0 or X <= 0:
        return []
    r = math.sqrt(disc)
    return sorted({round(math.degrees(math.atan((v0 * v0 + s * r) / (g * X))), 4) for s in (-1, 1)})


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-v", "--speed", type=float, default=30.0, help="launch speed v0 (m/s)")
    ap.add_argument("-a", "--angle", type=float, default=45.0, help="launch angle (deg)")
    ap.add_argument("--h0", type=float, default=0.0, help="launch height (m)")
    ap.add_argument("-g", type=float, default=9.81, help="gravity (m/s^2)")
    ap.add_argument("--drag", action="store_true", help="also run the quadratic-drag model")
    ap.add_argument("--mass", type=float, default=0.43, help="mass (kg)")
    ap.add_argument("--diameter", type=float, default=0.22, help="diameter (m)")
    ap.add_argument("--cd", type=float, default=0.25, help="drag coefficient")
    ap.add_argument("--rho", type=float, default=1.225, help="air density (kg/m^3)")
    ap.add_argument("--target", type=float, nargs=2, metavar=("X", "Y"), help="find angles that hit (X, Y)")
    ap.add_argument("--csv", help="write the drag path (t, x, y) to this file")
    a = ap.parse_args()

    r = ideal(a.speed, a.angle, a.h0, a.g)
    print(f"Launch: v0={a.speed} m/s, theta={a.angle} deg, h0={a.h0} m, g={a.g} m/s^2")
    print(f"vx={r['vx']:.3f} m/s  vy={r['vy']:.3f} m/s")
    rows = [("Time of flight (s)", "T", 3), ("Range (m)", "R", 3), ("Max height (m)", "H", 3),
            ("Impact speed (m/s)", "v_impact", 3), ("Impact angle (deg)", "angle_impact", 2)]
    d = None
    if a.drag:
        d = with_drag(a.speed, a.angle, a.h0, a.g, a.mass, a.diameter, a.cd, a.rho)
        print(f"Drag constant k = {d['k']:.5f} 1/m")
    print(f"\n{'':24}{'Ideal':>12}" + (f"{'With drag':>12}" if d else ""))
    for label, key, nd in rows:
        line = f"{label:24}{r[key]:>12.{nd}f}"
        if d:
            line += f"{d[key]:>12.{nd}f}"
        print(line)

    if a.target:
        X, Y = a.target
        sol = angles_to_hit(a.speed, X, Y, a.g)
        print(f"\nTarget ({X}, {Y}) m, no drag: " + (", ".join(f"{s:.2f} deg" for s in sol) if sol else "out of reach at this speed"))

    if a.csv and d:
        with open(a.csv, "w") as f:
            f.write("t,x,y\n")
            for t, x, y in d["path"][::10]:
                f.write(f"{t:.4f},{x:.4f},{y:.4f}\n")
        print(f"\nWrote {a.csv}")


if __name__ == "__main__":
    main()
