import React from 'react';
import { motion } from 'framer-motion';

const WelcomeMessage = ({ user, message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 p-6 rounded-xl bg-card/80 backdrop-blur-sm border shadow-lg"
    >
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Welcome back, {user}! 👋</h1>
      <p className="text-muted-foreground mt-2">{message}</p>
    </motion.div>
  );
};

export default WelcomeMessage;
