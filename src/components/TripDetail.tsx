                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center font-bold text-xl border border-orange-100/50 dark:border-orange-900/20 group-hover:scale-110 transition-transform">
                        {expense.category === 'Food' ? '🍕' : expense.category === 'Transport' ? '🛥️' : expense.category === 'Stay' ? '🏨' : expense.category === 'Fun' ? '🎡' : '💸'}
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm md:text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          {expense.description}
                          {expense.receiptUrl && (
                            <ReceiptPreview
                              receiptUrl={expense.receiptUrl}
                              receiptStoragePath={expense.receiptStoragePath}
                              description={expense.description}
                              isPdfReceipt={isPdfReceipt}
                              getReceiptData={getReceiptData}
                              onViewReceipt={() => {
                                setPreviewReceipt(expense.receiptUrl!);
                                setPreviewStoragePath(expense.receiptStoragePath);
                              }}
                              onOpenDocument={() => handleOpenDocument(expense.receiptUrl!, expense.receiptStoragePath)}
                              isCompact={true}
                            />
                          )}
                        </h5>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md">
                            {members.find(m => m.uid === expense.payerId)?.photoURL ? (
                               <img src={members.find(m => m.uid === expense.payerId)?.photoURL} alt={expense.payerName} className="w-4 h-4 rounded-full" />
                            ) : (
                               <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center shrink-0" />
                            )}
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                              <span className="text-slate-700 dark:text-slate-300">{expense.payerName || 'Member'}</span>
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            &bull; {formatDate(expense.date)}
                            {expense.createdByName && expense.createdByName !== expense.payerName && (
                              <span className="ml-2 opacity-60 italic normal-case font-medium">Logged by {expense.createdByName}</span>
                            )}
                          </p>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                            {expense.category}
                          </span>
                          {expense.participants && expense.participants.length === 1 && expense.participants[0] === expense.payerId ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Personal
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Shared with {expense.participants?.length || activeTrip?.members?.length || 0}
                            </span>
                          )}
                          {expense.receiptUrl && (
                            <button 
                              onClick={() => {
                                if (isPdfReceipt(expense.receiptUrl)) {
                                  handleOpenDocument(expense.receiptUrl!, expense.receiptStoragePath);
                                } else {
                                  setPreviewReceipt(expense.receiptUrl!);
                                  setPreviewStoragePath(expense.receiptStoragePath);
                                }
                              }}
                              className="px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-all cursor-pointer shadow-sm border border-emerald-100 dark:border-emerald-900/10"
                              title="Click to view full receipt"
                            >
                              <Receipt className="w-2.5 h-2.5" /> View Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-base md:text-lg font-black text-slate-900 dark:text-white font-mono">
                        {formatCurrency(expense.amount, activeTrip.currency)}
                      </span>
                      {expense.time && (
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-1 leading-none shadow-sm">
                          {expense.time}
                        </span>
                      )}
                    </div>
                  </motion.div>
