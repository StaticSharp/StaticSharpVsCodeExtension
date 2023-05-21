using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace ProjectMapSg
{
    public static class SimpleLogger
    {
        private static string _accumulatedLog = "";

        public static void Log(string log)
        {
            _accumulatedLog += $">>> {log}\n";
        }

        public static void Flush()
        {
            if (_accumulatedLog != "") {
                Directory.CreateDirectory("logs");
                File.WriteAllText($"logs\\log_{DateTime.Now.ToString("MMdd_hhmmss_ff")}.log", _accumulatedLog);
                _accumulatedLog = "";
            }
        }
    }
}
