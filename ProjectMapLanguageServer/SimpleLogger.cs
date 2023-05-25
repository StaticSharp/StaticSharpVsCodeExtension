using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectMapLanguageServer
{
    public class SimpleLogger
    {
        private static string _accumulatedLog = "";

        public static bool Enabled = false;

        public static void Log(string log) {
            if (Enabled) {
                _accumulatedLog += $">>> {log}\n";
            }
        }

        public static void LogException(Exception ex) {
            if (Enabled) {
                _accumulatedLog += $"EXCEPTION Type: {ex.GetType()}\n";
                _accumulatedLog += $"EXCEPTION Message: {ex.Message}\n";
                _accumulatedLog += $"EXCEPTION StackTrace: {ex.StackTrace}\n";
            }
        }

        public static void Flush() {
            if (Enabled) {
                if (_accumulatedLog != "") {
                    Directory.CreateDirectory("logs");
                    File.WriteAllText($"logs\\log_{DateTime.Now.ToString("MMdd_hhmmss_ff")}.log", _accumulatedLog);
                    _accumulatedLog = "";
                }
            }
        }
    }
}
