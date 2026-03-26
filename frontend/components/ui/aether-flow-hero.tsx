"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

class Particle {
    x: number;
    y: number;
    directionX: number;
    directionY: number;
    size: number;
    color: string;

    constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, mouse: { x: number | null, y: number | null, radius: number }) {
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        // Mouse collision detection
        if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius + this.size) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (mouse.radius - distance) / mouse.radius;
                this.x -= forceDirectionX * force * 5;
                this.y -= forceDirectionY * force * 5;
            }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw(ctx);
    }
}

// The main hero component
export default function AetherFlowHero() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Mouse position for parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 50, stiffness: 500 };

    // Right lottie moves more (foreground feel)
    const rightX = useSpring(useTransform(mouseX, [-1, 1], [30, -30]), springConfig);
    const rightY = useSpring(useTransform(mouseY, [-1, 1], [20, -20]), springConfig);
    const rightRotate = useSpring(useTransform(mouseX, [-1, 1], [-3, 3]), springConfig);

    // Left lottie moves opposite / less (depth parallax)
    const leftX = useSpring(useTransform(mouseX, [-1, 1], [-20, 20]), springConfig);
    const leftY = useSpring(useTransform(mouseY, [-1, 1], [-15, 15]), springConfig);
    const leftRotate = useSpring(useTransform(mouseX, [-1, 1], [2, -2]), springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window;
            mouseX.set((e.clientX / innerWidth) * 2 - 1);
            mouseY.set((e.clientY / innerHeight) * 2 - 1);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const mouse = { x: null as number | null, y: null as number | null, radius: 200 };

        function init() {
            particles = [];
            // Adjusted number of particles for performance & density
            const numberOfParticles = (canvas!.height * canvas!.width) / 9000;
            for (let i = 0; i < numberOfParticles; i++) {
                const size = (Math.random() * 2) + 1;
                const x = (Math.random() * ((window.innerWidth - size * 2) - (size * 2)) + size * 2);
                const y = (Math.random() * ((window.innerHeight - size * 2) - (size * 2)) + size * 2);
                const directionX = (Math.random() * 0.4) - 0.2;
                const directionY = (Math.random() * 0.4) - 0.2;
                // Adapted color to match the primary theme of BlockWarpRift (light mode)
                const color = 'rgba(37, 99, 235, 0.4)';
                particles.push(new Particle(x, y, directionX, directionY, size, color));
            }
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const connect = () => {
            let opacityValue = 1;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                        + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));

                    if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                        opacityValue = 1 - (distance / 20000);

                        const dx_mouse_a = particles[a].x - (mouse.x || 0);
                        const dy_mouse_a = particles[a].y - (mouse.y || 0);
                        const distance_mouse_a = Math.sqrt(dx_mouse_a * dx_mouse_a + dy_mouse_a * dy_mouse_a);

                        if (mouse.x && distance_mouse_a < mouse.radius) {
                            ctx!.strokeStyle = `rgba(37, 99, 235, ${opacityValue})`;
                        } else {
                            ctx!.strokeStyle = `rgba(37, 99, 235, ${opacityValue * 0.2})`;
                        }

                        ctx!.lineWidth = 1;
                        ctx!.beginPath();
                        ctx!.moveTo(particles[a].x, particles[a].y);
                        ctx!.lineTo(particles[b].x, particles[b].y);
                        ctx!.stroke();
                    }
                }
            }
        };

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            // Light mode background
            ctx!.fillStyle = '#ffffff';
            ctx!.fillRect(0, 0, window.innerWidth, window.innerHeight);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update(canvas!, ctx!, mouse);
            }
            connect();
        };

        const handleMouseMove = (event: MouseEvent) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        };

        const handleMouseOut = () => {
            mouse.x = null;
            mouse.y = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseOut);

        init();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseOut);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.2 + 0.2, // Faster initial load
                duration: 0.8,
            },
        }),
    };

    return (
        <div className="relative w-screen min-h-[90vh]  flex flex-col items-center justify-center overflow-hidden mb-20 bg-white">
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-80"></canvas>

            {/* Overlay HTML Content */}
            <div className="relative z-10 text-center p-6 w-full max-w-7xl mx-auto flex flex-col items-center">

                <motion.h1
                    custom={1}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-linear-to-b from-foreground to-gray-500"
                >
                    BlockWarp<span className="text-primary">Rift</span>
                </motion.h1>

                <motion.p
                    custom={2}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-2xl mx-auto text-lg text-text-secondary mb-10"
                >
                    An intelligent, adaptive framework for creating fluid Web3 payment experiences that feel alive and respond to user interaction in real-time.
                </motion.p>

                <motion.div
                    custom={3}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Link href="/register" className="px-8 py-4 bg-foreground text-white font-semibold rounded-xl shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 mx-auto sm:mx-0">
                        Start Accepting Crypto
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link href="/login" className="px-8 py-4 bg-white border border-border text-foreground font-semibold rounded-xl shadow hover:bg-gray-50 transition-all duration-300 flex items-center gap-2 mx-auto sm:mx-0">
                        Sign In to Dashboard
                    </Link>
                </motion.div>
            </div>

            <motion.div
                style={{ x: rightX, y: rightY, rotate: rightRotate }}
                className="absolute right-0 mt-50 w-250 h-64"
            >
                <DotLottieReact
                    src="crypto_animation.json"
                    loop
                    autoplay
                />
            </motion.div>

            <motion.div
                style={{ x: leftX, y: leftY, rotate: leftRotate }}
                className="absolute left-20 mb-50 w-250 h-64 rotate-180"
            >
                <DotLottieReact
                    src="ethereum_animation.json"
                    loop
                    autoplay
                />
            </motion.div>
        </div>
    );
}
