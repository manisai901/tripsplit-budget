import { motion } from 'motion/react';
import { Mail, MessageSquare, Send, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Get in Touch</h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Have questions or feedback? We'd love to hear from you.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Us</p>
                  <p className="text-slate-900 dark:text-white font-medium">manikantasaivootla@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chat with Us</p>
                  <p className="text-slate-900 dark:text-white font-medium">Available 24/7 in-app</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Office</p>
                  <p className="text-slate-900 dark:text-white font-medium">Vijayawada, AP</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <form action="https://formsubmit.co/manikantasaivootla@gmail.com" method="POST" className="space-y-5">
              {/* Optional: Add a hidden input to disable captcha if they want, but required for first setup */}
              <input type="hidden" name="_subject" value="New message from Traveler App!" />
              {/* Tell FormSubmit to return here after successful submit */}
              <input type="hidden" name="_next" value={window.location.href} />
              
              <div>
                <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Name</label>
                <input required id="name" name="name" type="text" className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" placeholder="Your name" />
              </div>
              <div>
                <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Email</label>
                <input required id="email" name="email" type="email" className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" placeholder="email@example.com" />
              </div>
              <div>
                <label htmlFor="message" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Message</label>
                <textarea required id="message" name="message" rows={4} className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-none p-4 focus:ring-2 focus:ring-orange-500/20 transition-all dark:text-white" placeholder="How can we help?"></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
