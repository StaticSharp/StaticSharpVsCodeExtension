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

        public static void Log(string log)
        {
            _accumulatedLog += $">>> {log}\n";
        }

        public static void Flush()
        {
            if (_accumulatedLog != "")
            {
                Directory.CreateDirectory("logs");
                File.WriteAllText($"logs\\log_{DateTime.Now.ToString("MMdd_hhmmss_ff")}.log", _accumulatedLog);
                _accumulatedLog = "";
            }
        }
    }
}
