# Projectile Lab

An Engineering Mechanics project on the kinematics of a particle: projectile motion solved analytically and numerically, with an interactive simulator and the same solver written in three languages.

## What it does
- Computes time of flight, range, maximum height, impact speed and impact angle.
- Compares the ideal parabola with a run that includes quadratic air drag (RK4 numerical integration).
- Shows a step-by-step worked solution for the ideal case.
- Works for any gravity, including the Moon (1.62 m/s²) and Mars (3.71 m/s²).

## Project layout
```
index.html     simulator page
style.css      styling (light and dark themes)
script.js      physics and drawing
solvers/
  projectile.py     Python solver, also finds angles that hit a target
  projectile.c      C solver
  Projectile.java   Java solver
```

## Run the website
Open `index.html` in any browser. No install needed.

## Run the solvers
```
python3 solvers/projectile.py -v 22 -a 35 --drag --target 40 5

gcc solvers/projectile.c -o projectile -lm
./projectile 22 35 0 9.81 1 0.43 0.22 0.25 1.225

javac solvers/Projectile.java
java -cp solvers Projectile 22 35 0 9.81 1 0.43 0.22 0.25 1.225
```
The C and Java arguments are: `v0 angle h0 g drag(0/1) mass diameter Cd rho`.

## Equations
- vx = v0 cos θ, vy = v0 sin θ
- T = (vy + √(vy² + 2 g h0)) / g
- R = vx T, H = h0 + vy² / 2g
- Drag: a = −k |v| v, with k = ½ ρ Cd A / m

## Publish on GitHub Pages
Upload all files to a repository, then go to Settings → Pages, choose the `main` branch and save.
