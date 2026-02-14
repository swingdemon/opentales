import { motion } from 'framer-motion';

const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
            mass: 1
        }
    }
};

export const FadeIn = ({ children, delay = 0, className = "", ...props }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={variants}
        transition={{ delay }}
        className={className}
        {...props}
    >
        {children}
    </motion.div>
);
