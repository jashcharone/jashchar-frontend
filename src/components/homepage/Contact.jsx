import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = ({ content }) => {
  const email = content?.email;
  const phone = content?.phone;
  const address = content?.address;
  // Use content title if available, otherwise default to the one in the image
  const title = content?.title || "Need Any Urgent Help? Call us Anytime!";
  
  if (!content || (!email && !phone && !address)) return null;

  return (
    <section id="contact" className="py-24 bg-[#0B1120] text-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            {title}
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Email Card */}
          {email && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#151F32] rounded-2xl p-10 flex flex-col items-center text-center hover:bg-[#1c2840] transition-colors duration-300 group border border-slate-800/50"
            >
              <div className="w-16 h-16 rounded-full bg-[#0B1120] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Mail className="h-7 w-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <p className="text-slate-400 text-lg">{email}</p>
            </motion.div>
          )}
          
          {/* Phone Card */}
          {phone && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#151F32] rounded-2xl p-10 flex flex-col items-center text-center hover:bg-[#1c2840] transition-colors duration-300 group border border-slate-800/50"
            >
              <div className="w-16 h-16 rounded-full bg-[#0B1120] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Phone className="h-7 w-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Phone</h3>
              <p className="text-slate-400 text-lg">{phone}</p>
            </motion.div>
          )}

          {/* Address Card */}
          {address && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-[#151F32] rounded-2xl p-10 flex flex-col items-center text-center hover:bg-[#1c2840] transition-colors duration-300 group border border-slate-800/50"
            >
              <div className="w-16 h-16 rounded-full bg-[#0B1120] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <MapPin className="h-7 w-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Address</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xs">{address}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Contact;
